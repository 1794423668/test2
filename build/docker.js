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
 * @fileoverview Gulp tasks for deploying and releasing the application.
 */
import child from 'child_process';
import gulp from 'gulp';
import path from 'path';
import del from 'del';
import swig from 'gulp-swig';
import data from 'gulp-data';
import rename from "gulp-rename";

import conf from './conf';

gulp.task('clean', function () {
  return del("dockerfile", {
    cwd: conf.paths.dist
  });
});

gulp.task('docker-templates', ['clean'], function () {
  return gulp.src(path.join(conf.paths.build, 'dockerfile'))
    .pipe(data({
      BASEIMAGE: conf.deploy.baseImage
    }))
    .pipe(swig())
    .pipe(rename({extname: ""}))
    .pipe(gulp.dest(path.join(conf.paths.dist)))
});

gulp.task('docker-pull', function () {
  return pullDockerImages([conf.deploy.baseImage]);
});

gulp.task('docker-image', ['docker-pull', 'docker-templates'], function () {
  return buildDockerImage([
    [conf.deploy.getImageURL(), conf.paths.base, path.join(conf.paths.dist, 'dockerfile')]
  ]);
});
gulp.task('docker-push' , ['docker-image'], function () {
  return pushDockerImage([conf.deploy.getImageURL()]);
});

/**
 * @param {!Array<string>} args
 * @param {function(?Error=)} doneFn
 */
function spawnDockerProcess(args, doneFn) {
  let dockerTask = child.spawn('docker', args, {
    stdio: 'inherit'
  });

  // Call Gulp callback on task exit. This has to be done to make Gulp dependency management
  // work.
  dockerTask.on('exit', function (code) {
    if (code === 0) {
      doneFn();
    } else {
      doneFn(new Error(`Docker command error, code: ${code} , commands : "docker ${args.join(' ')}"`));
    }
  });
}

/**
 * @param {!Array<string>} imageNames
 * @return {!Promise}
 */
function pullDockerImages(imageNames) {
  let spawnPromises = imageNames.map((imageName) => {
    return new Promise((resolve, reject) => {
      spawnDockerProcess(
        [
          'pull',
          imageName,
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  });

  return Promise.all(spawnPromises);
}

/**
 * @param {!Array<!Array<string>>} imageNamesAndDirs (image name, directory) pairs
 * @return {!Promise}
 */
function buildDockerImage(imageNamesAndDirs) {
  let spawnPromises = imageNamesAndDirs.map((imageNameAndDir) => {
    let [imageName, dir, file] = imageNameAndDir;
    return new Promise((resolve, reject) => {
      spawnDockerProcess(
        [
          'build',
          // Remove intermediate containers after a successful build.
          '--rm=true',
          '--file',
          file,
          '--tag',
          imageName,
          dir
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  });

  return Promise.all(spawnPromises);
}

/**
 * @param {!Array<string>} imageNames
 * @return {!Promise}
 */
function pushDockerImage(imageNames) {
  let spawnPromises = imageNames.map((imageName) => {
    return new Promise((resolve, reject) => {
      spawnDockerProcess(
        [
          'push',
          imageName,
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  });

  return Promise.all(spawnPromises);
}