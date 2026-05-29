FROM debian

# Install curl (just to be able to install NodeJS)
RUN apt-get update -yq \
  && apt-get install curl -yq \
  && apt-get clean -y

# Install NodeJS from APT repository (-yq: yes & quiet)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y nodejs

# Package project folder and install node modules in early docker layer
RUN mkdir -p /home/telstackedit
ADD package.json /home/telstackedit/package.json
WORKDIR /home/telstackedit
RUN npm install

ADD build /home/telstackedit/build
ADD server /home/telstackedit/server
ADD src /home/telstackedit/src
ADD static /home/telstackedit/static

# Go back to default workdir
WORKDIR /
