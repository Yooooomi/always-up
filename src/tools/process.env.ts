import { Environment } from "./env";

export class ProcessEnvironment extends Environment {
  getInterval() {
    let interval = +(process.env.CHECK_INTERVAL ?? "60");
    if (isNaN(interval)) {
      interval = 60;
    }
    return interval;
  }

  getShutdownTimeout() {
    let interval = +(process.env.SHUTDOWN_TIMEOUT ?? "3");
    if (isNaN(interval)) {
      interval = 3;
    }
    return interval;
  }
}
