# Always-up

Always up is a **ultra-lightweight** script automating the **restart-on-unhealthy** policy for docker containers. It regularly checks for unhealthy containers and restart them.

## Installation

### Using docker-compose

```yml
version: "3"

services:
  always-up:
    image: yooooomi/always-up
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      CHECK_INTERVAL: 60
      SHUTDOWN_TIMEOUT: 5
```


## Configuration

The configuration of always-up is done through labels assigned to a container.

### Using docker-compose

```yml
version: "3"

services:
  unstable_service:
    image: unstable_program
    healthcheck:
      test: ["CMD", "some_command"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      always-up.enabled: true
```

### Using docker

```sh
docker run --label always-up.enabled=true unstable_program
```

## Dependencies

It can happen that an unhealthy container has **other containers depending on it** (i.g a container uses the other container network)

Containers with dependencies are first stopped from the most dependant one to the least, then started again from the least dependant one to the most.

You can specify dependencies through labels too.

### Using docker-compose

```yml
version: "3"

services:
  vpn:
    image: some_vpn
    healthcheck:
      test: ["CMD", "curl", "-f", "https://google.com"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      always-up.enabled: true

  unstable_service:
    image: unstable_program
    network_mode: container:vpn
    labels:
      always-up.enabled: true # necessary
      always-up.depends_on: vpn
```

> `always-up.enabled: true` without specifying a health check will act as container always healthy.

### Using docker

```sh
docker run --label always-up.enabled=true --label always-up.depends_on=vpn unstable_program
```
