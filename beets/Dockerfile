# working as of 2022-09-08 (not pinning the base image)
FROM lscr.io/linuxserver/beets:latest

# Installing dependencies...
# copyartifacts is optional but recommended
RUN pip install --no-cache-dir markdownify natsort beets-copyartifacts3

COPY config/config.yaml /config/config.yaml
COPY plugins/audible /plugins/audible

# We could have an entrypoint