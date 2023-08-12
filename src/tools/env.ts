export abstract class Environment {
  abstract getInterval(): number;
  abstract getShutdownTimeout(): number;
}
