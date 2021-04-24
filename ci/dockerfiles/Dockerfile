ARG FLAVOR=14-alpine

FROM node:$FLAVOR

MAINTAINER cronic@zensystem.io

RUN apk --no-cache add bash build-base python3

USER node

VOLUME /build

WORKDIR /build

SHELL ["/bin/bash", "-c"]
