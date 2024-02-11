FROM debian

# Install NodeJS from APT repository
RUN apt-get update -yq \
  && apt-get install nodejs -yq \
  && apt-get install npm -yq \
  && apt-get clean -y

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
