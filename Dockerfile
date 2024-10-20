FROM node:18 as build


# RUN groupmod -g 2000 node && usermod -u 2000 -g 2000 node 

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
# RUN mkdir /opt/node_app && chown node:node /opt/node_app
# WORKDIR /opt/node_app

# the official node image provides an unprivileged user as a security best practice
# but we have to manually enable it. We put it here so npm installs dependencies as the same
# user who runs the app. 
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
# USER node
# COPY --chown=node:node package*.json ./
COPY package*.json ./
RUN npm ci && npm cache clean --force
# ENV PATH /opt/node_app/node_modules/.bin:$PATH


# copy in our source code last, as it changes the most
# RUN mkdir /opt/node_app/app && chown node:node /opt/node_app/app
# WORKDIR /opt/node_app/app
COPY --chown=node:node . .

RUN npm run build

ENTRYPOINT [ "node" , "--max-old-space-size=1536"]
