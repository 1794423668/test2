// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Common configuration constants used in other build/test files.
 */
import path from 'path';
import fs from 'fs';

/**
 * Base path for all other paths.
 */
const basePath = path.join(__dirname, '../');

let projectjson = JSON.parse(fs.readFileSync('./package.json'));

/**
 * Exported configuration object with common constants used in build pipeline.
 */
export default {

  project: {
    name: projectjson.name,
    version: projectjson.version
  },

  /**
   * Deployment constants configuration.
   */
  deploy: {
    baseImage: process.env.REGISTRY_BASE_IMAGE || "registry.ispacesys.cn/pm2/restbase:7-centos",
    image: process.env.REGISTRY_IMAGE,
    imageName: process.env.REGISTRY_IMAGENAME || "registry.ispacesys.cn/cig/rest-cigsystem-user",
    imageTag: process.env.REGISTRY_IMAGETAG || projectjson.version,
    imageChannel: process.env.REGISTRY_IMAGECHANNEL,
    getImageURL: function () {
      if (this.image && this.image.length > 0) return this.image;
      let imageURL = `${this.imageName}:${this.imageTag}`;
      if (this.imageChannel && this.imageChannel.length > 0) imageURL = `${this.imageName}:${this.imageTag}-${this.imageChannel}`;
      return imageURL;
    }
  },

  /**
   * Absolute paths to known directories, e.g., to source directory.
   */
  paths: {
    base: basePath,
    dist: path.join(basePath, 'dist'),
    build: path.join(basePath, 'build')
  },
};