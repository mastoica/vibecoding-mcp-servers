import Dockerode from 'dockerode';
import type {
  ContainerInfo,
  ContainerInspectResult,
  ExecResult,
  ListContainersInput,
  StartContainerInput,
  GetContainerLogsInput,
  ExecCommandInput,
} from './types.js';

export class DockerClient {
  private docker: Dockerode;

  constructor() {
    this.docker = new Dockerode();
  }

  async listContainers(input: ListContainersInput): Promise<ContainerInfo[]> {
    const filters: Record<string, string[]> = {};

    if (input.filters?.status) {
      filters.status = input.filters.status;
    }

    if (input.filters?.label) {
      filters.label = input.filters.label;
    }

    if (input.filters?.name) {
      filters.name = [input.filters.name];
    }

    const containers = await this.docker.listContainers({
      all: input.all ?? false,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    return containers.map(container => ({
      id: container.Id,
      name: container.Names[0]?.replace(/^\//, '') || 'unknown',
      image: container.Image,
      status: container.Status,
      state: container.State,
      ports: container.Ports.map(port => ({
        privatePort: port.PrivatePort,
        publicPort: port.PublicPort,
        type: port.Type,
      })),
      created: new Date(container.Created * 1000),
    }));
  }

  async startContainer(input: StartContainerInput): Promise<ContainerInfo> {
    if (input.containerId) {
      // Start existing container
      const container = this.docker.getContainer(input.containerId);
      await container.start();

      const info = await container.inspect();
      return this.mapContainerInfo(info);
    } else if (input.image) {
      // Create and start new container
      const portBindings: Record<string, Array<{ HostPort: string }>> = {};
      const exposedPorts: Record<string, object> = {};

      if (input.ports) {
        for (const [containerPort, hostPort] of Object.entries(input.ports)) {
          const key = `${containerPort}/tcp`;
          exposedPorts[key] = {};
          portBindings[key] = [{ HostPort: hostPort }];
        }
      }

      const envArray = input.env
        ? Object.entries(input.env).map(([key, value]) => `${key}=${value}`)
        : [];

      const binds = input.volumes
        ? Object.entries(input.volumes).map(([host, container]) => `${host}:${container}`)
        : [];

      const container = await this.docker.createContainer({
        Image: input.image,
        name: input.name,
        Env: envArray,
        ExposedPorts: exposedPorts,
        HostConfig: {
          PortBindings: portBindings,
          Binds: binds,
        },
      });

      await container.start();
      const info = await container.inspect();
      return this.mapContainerInfo(info);
    } else {
      throw new Error('Either containerId or image must be provided');
    }
  }

  async stopContainer(containerId: string, timeout = 10): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop({ t: timeout });
  }

  async restartContainer(containerId: string, timeout = 10): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.restart({ t: timeout });
  }

  async getContainerLogs(input: GetContainerLogsInput): Promise<string> {
    const container = this.docker.getContainer(input.containerId);

    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      since: input.since,
      tail: input.tail,
      timestamps: input.timestamps ?? false,
      follow: false, // Always false for now, true would return a stream
    });

    // Convert buffer to string
    if (Buffer.isBuffer(logStream)) {
      return this.demuxDockerStream(logStream);
    }

    return '';
  }

  async execCommand(input: ExecCommandInput): Promise<ExecResult> {
    const container = this.docker.getContainer(input.containerId);

    const envArray = input.env
      ? Object.entries(input.env).map(([key, value]) => `${key}=${value}`)
      : [];

    const exec = await container.exec({
      Cmd: input.command,
      WorkingDir: input.workDir,
      Env: envArray,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ Detach: false });

    const output = await new Promise<string>((resolve) => {
      let data = '';
      stream.on('data', (chunk: Buffer) => {
        data += this.demuxDockerStream(chunk);
      });
      stream.on('end', () => {
        resolve(data);
      });
    });

    const inspectResult = await exec.inspect();

    return {
      exitCode: inspectResult.ExitCode ?? 0,
      output: output.trim(),
    };
  }

  async inspectContainer(containerId: string): Promise<ContainerInspectResult> {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();

    return {
      id: info.Id,
      name: info.Name.replace(/^\//, ''),
      image: info.Config.Image,
      state: {
        status: info.State.Status,
        running: info.State.Running,
        paused: info.State.Paused,
        restarting: info.State.Restarting,
        exitCode: info.State.ExitCode,
        startedAt: info.State.StartedAt,
        finishedAt: info.State.FinishedAt,
      },
      config: {
        hostname: info.Config.Hostname,
        env: info.Config.Env || [],
        cmd: info.Config.Cmd || [],
        image: info.Config.Image,
        workingDir: info.Config.WorkingDir,
      },
      networkSettings: {
        ports: info.NetworkSettings.Ports,
        ipAddress: info.NetworkSettings.IPAddress,
      },
      mounts: info.Mounts.map(mount => ({
        type: mount.Type,
        source: mount.Source,
        destination: mount.Destination,
        mode: mount.Mode,
      })),
    };
  }

  private mapContainerInfo(info: Dockerode.ContainerInspectInfo): ContainerInfo {
    const ports = Object.entries(info.NetworkSettings.Ports || {}).flatMap(
      ([containerPort, bindings]) => {
        const [port, type] = containerPort.split('/');
        if (!bindings) {
          return [{
            privatePort: parseInt(port),
            type: type || 'tcp',
          }];
        }
        return bindings.map(binding => ({
          privatePort: parseInt(port),
          publicPort: binding.HostPort ? parseInt(binding.HostPort) : undefined,
          type: type || 'tcp',
        }));
      }
    );

    return {
      id: info.Id,
      name: info.Name.replace(/^\//, ''),
      image: info.Config.Image,
      status: info.State.Status,
      state: info.State.Running ? 'running' : 'stopped',
      ports,
      created: new Date(info.Created),
    };
  }

  private demuxDockerStream(buffer: Buffer): string {
    // Docker stream format: 8-byte header + payload
    // Header: [stream_type, 0, 0, 0, size1, size2, size3, size4]
    let result = '';
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;

      const header = buffer.subarray(offset, offset + 8);
      const size = header.readUInt32BE(4);

      if (offset + 8 + size > buffer.length) break;

      const payload = buffer.subarray(offset + 8, offset + 8 + size);
      result += payload.toString('utf-8');

      offset += 8 + size;
    }

    return result;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}
