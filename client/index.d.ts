declare module "cortex-cli/client" {
  export interface InstanceEndpoint {
    url: string;
    description: string;
  }

  export interface ActionStatus {
    name: string;
    state: string;
  }

  export interface HealthStatus {
    ok: boolean;
    message: string;
  }

  export interface InstanceHealth {
    health: Record<string, HealthStatus>;
    healthy: boolean;
    name: string;
    version: string;
  }

  export interface InstanceStatus {
    deployType: string;
    endpoints: Record<string, InstanceEndpoint>;
    healths: InstanceHealth[];
    version: string;
  }

  export interface InputOutputParams {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
  }

  export interface RoutingRule {
    match: string;
    action: string;
    runtime?: string;
    output: string;
  }

  export interface AllRouting {
    action: string;
    runtime?: string;
    output: string;
  }

  export interface PropertyRouting {
    property: string;
    default?: AllRouting;
    rules: RoutingRule[];
  }

  export interface FieldRouting {
    field: string;
    default?: AllRouting;
    rules: RoutingRule[];
  }

  export interface Input {
    name: string;
    title: string;
    parameters?: InputOutputParams[] | Reference;
    routing: {
      field?: string;
      property?: string;
      all: AllRouting;
      default?: RoutingRule;
      rules?: RoutingRule[];
    };
  }

  export interface Output {
    name: string;
    title: string;
    parameters?: InputOutputParams[] | Reference;
  }

  export interface PropertyDefinition {
    name: string;
    title: string;
    description: string;
    required?: boolean;
    type: string;
    defaultValue?: any;
    validValues?: string[];
    qualifiedBy?: string;
    secure?: boolean;
  }

  export interface PropertyValue {
    name: string;
    value: any;
  }

  export interface Tag {
    label: string;
    value: string;
  }

  export interface Parameter {
    name: string;
    type: string;
    title?: string;
    description?: string;
    format?: string;
    required?: boolean;
  }

  export interface Reference {
    $ref: string;
  }

  export interface URLReference {
    $url: string;
  }

  export interface DatasetReference {
    name: string;
    title?: string;
    description?: string;
    parameters?: Parameter[] | Reference[];
    requiresWrite?: boolean;
  }

  export interface ConnectionReference {
    name: string;
    type: string;
    query?: PropertyValue;
    environment?: string;
  }

  export interface ConnectionConfig {
    default?: ConnectionReference;
    environments?: ConnectionReference;
  }

  export interface Payload {
    records?: any[];
    columns?: string;
    values?: any;
    $ref?: Reference;
  }

  export interface Message {
    payload: Payload;
    parameters?: Parameter[];
  }

  export interface Dataset {
    camel: string;
    name: string;
    title: string;
    description?: string;
    tags?: Tag[];
    parameters: Parameter[];
    connections: ConnectionConfig[];
  }

  export interface Type {
    camel: string;
    name: string;
    title: string;
    description?: string;
    parameters: Parameter[];
  }

  export interface Action {
    name: string;
    description?: string;
    image: string;
    command: string[];
    port?: string;
    type: string;
    scaleCount: number;
    environmentVariables?: string | null;
  }

  export interface Skill {
    camel: string;
    name: string;
    title: string;
    description?: string;
    deployStatus?: string;
    actionStatuses?: ActionStatus[];
    createdAt: string;
    createdBy: string;
    tags?: Tag[];
    inputs: Input[];
    outputs: Output[];
    properties?: PropertyDefinition[];
    actions?: Action[];
    datasets?: Dataset[];
    updatedAt?: string;
  }

  export interface Experiment {
    name: string;
    title?: string;
    description?: string;
    tags?: Tag[];
    properties?: PropertyDefinition[];
  }

  export interface Model {
    name: string;
    title?: string;
    description?: string;
    tags?: Tag[];
    properties?: PropertyDefinition[];
    type?: string;
    mode?: string;
    status?: string;
    source?: string;
  }

  export interface ExperimentRun {
    name: string;
    experimentName: string;
    title?: string;
    description?: string;
    tags?: Tag[];
    params?: any;
    metrics?: any;
    meta?: any;
    artifacts?: any;
    runId: string;
  }

  export interface ManagedContent {
    name: string;
    title?: string;
    description?: string;
    connectionType?: string;
    allowWrite?: boolean;
    params?: any[];
  }

  export interface Activation {
    success: boolean;
    activationId: string;
    instanceId: string;
    channelId: string;
    sessionId: string;
    tenantId: string;
    username: string;
    status: string;
    start: number;
    end: number;
    type: string;
    request?: any;
    requestType?: string;
    response?: any;
    responseType?: string;
    inputServiceName?: string;
    outputServiceName?: string;
    datasetName: string;
    trigger: any;
  }

  export interface AgentIO {
    name: string;
    title?: string;
    description?: string;
    signalType: string;
  }

  export interface Agent {
    name: string;
    title?: string;
    description?: string;
    properties?: PropertyDefinition[];
    inputs?: AgentIO[];
    outputs?: AgentIO[];
    processors?: any[];
  }

  export interface Session {
    description?: string;
    sessionId: string;
    ttl: number;
  }

  export interface Log {
    name: string;
    log: string;
  }

  export interface Artifact {
    artifactId: string;
    experimentName: string;
    projectId: string;
    runId: string;
  }

  export interface User {
    externalGroups: string[];
    grants: any[];
    projects: string[];
    roles: string[];
    user: string;
  }

  export interface Project {
    name: string;
    title: string;
    description?: string;
  }

  export interface Connection {
    name: string;
    title: string;
    description?: string;
    connectionType: string;
    allowWrite: boolean;
    allowRead: boolean;
    params: Parameter[];
  }

  export interface Secret {
    key: string;
    value: string;
  }

  export class Catalog {
    cortexUrl: any;
    endpoints: {
      skills: (projectId: string) => string;
      agents: (projectId: string) => string;
      types: (projectId: string) => string;
      campaigns: (projectId: string) => string;
    };
    constructor(cortexUrl: any);
    saveSkill(
      projectId: string,
      token: string,
      skillObj: Skill
    ): Promise<string>;
    listSkills(
      projectId: string,
      token: string,
      query?: any,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): Promise<Skill[]>;
    describeSkill(
      projectId: string,
      token: string,
      skillName: string,
      verbose?: boolean,
      output?: string
    ): Promise<Skill>;
    deleteSkill(projectId: string, token: string, skillName: string): any;
    deploySkill(
      projectId: string,
      token: string,
      skillName: string,
      verbose?: boolean
    ): any;
    unDeploySkill(
      projectId: string,
      token: string,
      skillName: string,
      verbose?: boolean
    ): any;
    skillLogs(
      projectId: string,
      token: string,
      skillName: string,
      actionName: any,
      verbose?: boolean
    ): any;

    saveType(projectId: string, token: string, types: any): any;
    describeType(projectId: string, token: string, typeName: any): any;
    listTypes(
      projectId: string,
      token: string,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): any;
    deleteType(projectId: string, token: string, typeName: any): any;

    listAgents(
      projectId: string,
      token: string,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): any;
    // listServices(projectId: string, token: string, agentName: string, filter: any, limit: any, skip: any, sort: any): any;
    saveAgent(projectId: string, token: string, agentObj: Agent): any;
    describeAgent(
      projectId: string,
      token: string,
      agentName: string,
      verbose?: any
    ): Promise<Agent>;
    // describeAgentVersions(projectId: string, token: string, agentName: string): any;
    deployAgent(
      projectId: string,
      token: string,
      agentName: string,
      verbose?: boolean
    ): any;
    deleteAgent(projectId: string, token: string, agentName: string): any;
    unDeployAgent(
      projectId: string,
      token: string,
      agentName: string,
      verbose?: boolean
    ): any;

    // exportCampaign(projectId: string, token: string, campaignName: any, deployable: any, path: any): Promise<any>;
    // importCampaign(projectId: string, token: string, filepath: any, deploy: any, overwrite: any): void;
    // undeployCampaign(projectId: string, token: string, campaign: any): any;
    // deployCampaign(projectId: string, token: string, campaign: any): any;
    // undeployMission(projectId: string, token: string, campaign: any, mission: any): any;
    // listMissions(projectId: string, token: string, campaign: any, filter: any, limit: any, skip: any, sort: any): any;
    // deployMission(projectId: string, token: string, campaign: any, mission: any): any;
    // getMission(projectId: string, token: string, campaign: any, mission: any): any;
  }

  export class Agents {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpointV4: (projectId: any) => string;
    invokeAgentService(
      projectId: any,
      token: any,
      agentName: string,
      serviceName: any,
      params: any
    ): any;
    invokeSkill(
      projectId: any,
      token: any,
      skillName: any,
      inputName: any,
      params: any
    ): any;
    getActivation(
      projectId: any,
      token: any,
      activationId: any,
      verbose?: any,
      report?: any
    ): any;
    listActivations(projectId: any, token: any, params?: any): any;
    listAgentSnapshots(
      projectId: any,
      token: any,
      agentName: string,
      filter: any,
      limit: any,
      skip: any,
      sort: any
    ): any;
    describeAgentSnapshot(
      projectId: any,
      token: any,
      snapshotId: any,
      output: any
    ): any;
    createAgentSnapshot(projectId: any, token: any, snapshot: any): any;
  }

  export class Connections {
    constructor(cortexUrl: any);
    endpoint: (projectId: any) => string;
    cortexUrl: any;
    listConnections(
      projectId: any,
      token: any,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): Promise<Connection[]>;
    saveConnection(
      projectId: any,
      token: any,
      connObj: Connection
    ): Promise<any>;
    describeConnection(projectId: any, token: any, connectionName: any): any;
    deleteConnection(projectId: any, token: any, connectionName: any): any;
    listConnectionsTypes(
      token: any,
      filter: any,
      limit: any,
      skip: any,
      sort: any
    ): any;
  }

  export class Content {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpoint: (projectId: any) => string;
    _sanitizeKey(key: any): any;
    listContent(projectId: any, token: any): any;
    uploadContentStreaming(
      projectId: any,
      token: any,
      key: any,
      content: any,
      showProgress?: boolean,
      contentType?: string
    ): Promise<any>;
    deleteContent(projectId: any, token: any, key: any): any;
    downloadContent(
      projectId: any,
      token: any,
      key: any,
      showProgress?: boolean,
      toFile?: any
    ): any;
  }

  export class Experiments {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpoint: (projectId: string) => string;
    listExperiments(
      projectId: string,
      modelId: any,
      token: string,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): Promise<Experiment[]>;
    describeExperiment(
      projectId: string,
      token: string,
      name: any
    ): Promise<Experiment>;
    deleteExperiment(projectId: string, token: string, name: any): any;
    listRuns(
      projectId: string,
      token: string,
      experimentName: string,
      filter?: any,
      limit?: any,
      sort?: any,
      skip?: any
    ): Promise<ExperimentRun[]>;
    describeRun(
      projectId: string,
      token: string,
      experimentName: string,
      runId: string
    ): any;
    deleteRun(
      projectId: string,
      token: string,
      experimentName: string,
      runId: string
    ): any;
    _artifactKey(experimentName: string, runId: string, artifact: any): string;
    downloadArtifact(
      projectId: string,
      token: string,
      experimentName: string,
      runId: string,
      artifactName: any,
      showProgress?: boolean
    ): Promise<any>;
    saveExperiment(
      projectId: string,
      token: string,
      experimentObj: Experiment
    ): any;
    createRun(projectId: string, token: string, runObj: ExperimentRun): any;
    updateRun(projectId: string, token: string, runObj: ExperimentRun): any;
    uploadArtifact(
      projectId: string,
      token: string,
      experimentName: string,
      runId: string,
      content: string,
      artifact: string,
      contentType?: string
    ): Promise<any>;
  }

  export class Models {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpointV4: (projectId: any) => string;
    saveModel(projectId: any, token: any, modelObj: any): Promise<any>;
    updateModelStatus(
      projectId: any,
      token: any,
      modelName: any,
      status: any
    ): Promise<any>;
    deleteModel(projectId: any, token: any, modelName: any): Promise<any>;
    describeModel(
      projectId: any,
      token: any,
      modelName: any,
      verbose?: any
    ): any;
    listModels(
      projectId: any,
      skip: any,
      limit: any,
      filter: any,
      sort: any,
      tags: any,
      token: any
    ): any;
    listModelRuns(
      projectId: any,
      modelName: any,
      token: any,
      filter: any,
      limit: any,
      skip: any,
      sort: any
    ): any;
  }

  export class Secrets {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpoint: (projectId: any) => any;
    listSecrets(projectId: any, token: any): any;
    readSecret(projectId: any, token: any, keyName: any): any;
    deleteSecret(projectId: any, token: any, keyName: any): any;
    writeSecret(projectId: any, token: any, keyName: any, value: any): any;
  }

  export class Sessions {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpointV4: (projectId: any) => string;
    saveSession(projectId: any, token: any, sessionObj: any): any;
    deleteSession(projectId: any, token: any, sessionName: any): any;
    describeSession(
      projectId: any,
      token: any,
      sessionName: any,
      verbose?: any
    ): any;
    listSessions(projectId: any, token: any, limit?: any): any;
  }

  export class AmpServer {
    constructor(cortexUrl: any);
    cortexUrl: any;
    endpoint: string;
    _client(token: any): any;
    getProject(token: any, projectId: any): Promise<Project>;
    listProjects(
      token: any,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): Promise<Project[]>;
    createProject(token: any, projDef: Project): Promise<any>;
    getCampaign(projectId: any, token: any, campaignId: any): Promise<any>;
    listCampaigns(
      projectId: any,
      token: any,
      filter?: any,
      limit?: any,
      skip?: any,
      sort?: any
    ): Promise<any>;
    listModels(
      projectId: any,
      offset: any,
      limit: any,
      token: any
    ): Promise<any>;
    descModels(projectId: any, name: any, token: any): Promise<any>;
  }

  export class Info {
    constructor(cortexUrl: any);
    endpoint: () => string;
    cortexUrl: any;
    getInfo(): any;
  }

  export class Users {
    constructor(cortexUrl: any, user?: any, flags?: any[]);
    cortexUrl: any;
    endpoint: string;
    flags: string;
    usersEndpoint: string;
    usersProjectsEndpoint: string;
    createServiceUser(token: string, user: User): any;
    deleteServiceUser(token: string, user: User): any;
    listServiceUsers(token: string): any;
    describeUser(token: string): any;
    createGrantForUser(token: string, body: any): any;
    removeGrantFromUser(token: string, body: any): any;
    addUsersToProject(token: string, project: any, users: any): any;
    removeUsersFromProject(token: string, project: any, users: any): any;
  }
}
