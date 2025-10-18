export interface ListContainersInput {
  all?: boolean;
  filters?: {
    status?: string[];
    label?: string[];
    name?: string;
  };
}

export interface StartContainerInput {
  containerId?: string;
  image?: string;
  name?: string;
  ports?: Record<string, string>;
  env?: Record<string, string>;
  volumes?: Record<string, string>;
}

export interface StopContainerInput {
  containerId: string;
  timeout?: number;
}

export interface RestartContainerInput {
  containerId: string;
  timeout?: number;
}

export interface GetContainerLogsInput {
  containerId: string;
  since?: number;
  tail?: number;
  follow?: boolean;
  timestamps?: boolean;
}

export interface ExecCommandInput {
  containerId: string;
  command: string[];
  workDir?: string;
  env?: Record<string, string>;
}

export interface InspectContainerInput {
  containerId: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: string;
  }>;
  created: Date;
}

export interface ContainerInspectResult {
  id: string;
  name: string;
  image: string;
  state: {
    status: string;
    running: boolean;
    paused: boolean;
    restarting: boolean;
    exitCode: number;
    startedAt: string;
    finishedAt: string;
  };
  config: {
    hostname: string;
    env: string[];
    cmd: string[];
    image: string;
    workingDir: string;
  };
  networkSettings: {
    ports: Record<string, Array<{ HostIp: string; HostPort: string }> | null>;
    ipAddress: string;
  };
  mounts: Array<{
    type: string;
    source: string;
    destination: string;
    mode: string;
  }>;
}

export interface ExecResult {
  exitCode: number;
  output: string;
}
