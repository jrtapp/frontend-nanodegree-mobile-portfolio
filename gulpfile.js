/// <binding />
/**
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uncss = require('gulp-uncss');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cleancss = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var inlinesource = require('gulp-inline-source');
var cache = require('gulp-cache');
var del = require('del');
var jshint = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var runSequence = require('run-sequence');
var pagespeed = require('psi');
var $ = require('gulp-load-plugins')();

var reload = browserSync.reload;

// Lint JavaScript
gulp.task('jshint', function() {
  console.log('jshint: running');
  return gulp.src(['src/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
});

// Optimize Images
gulp.task('images', function() {
  console.log('images: running');
  return gulp.src(['./src/img/*','./src/views/images/*'])
    .pipe(imagemin())
    .pipe(gulp.dest(function(file) {
      console.log(file.base);
    return file.base.replace('src','dist');
  }))
});

// Inline script and css
gulp.task('inline', function(){
 return gulp.src(['src/**/*.html'])
    .pipe(inlinesource())
    .pipe(gulp.dest('dist'))
});

// Copy All Files At The Root Level (app)
gulp.task('copy', function() {
  console.log('copy: running');
  return gulp.src([
    'src/*',
    'src/*.html',
    'src/*.ico',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  })
  .pipe(gulp.dest('dist'))
});

// Copy image files from the Styleguide
gulp.task('styleguide-images', function() {
  console.log('styleguide-images: running');

  return gulp.src('src/styleguide/**/*.{svg,png,jpg}')
    .pipe(gulp.dest('dist/styleguide/'))
    //.pipe($.size({title: 'styleguide-images'}));
});

// Copy Web Fonts To Dist
gulp.task('fonts', function() {
  console.log('fonts: running');
  return gulp.src(['src/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    //.pipe($.size({title: 'fonts'}));
});

// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function() {

  var AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];
  console.log('styles: running');

  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'src/**/*.scss',
    'src/**/*.css'
  ])
    .pipe($.changed('styles', {extension: '.scss'}))
    .pipe($.sass({
      precision: 10,
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp'))
    // Concatenate And Minify Styles
    .pipe($.if('*.css', $.csso()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'styles'}));
});

// Concatenate And Minify JavaScript
gulp.task('scripts', function() {
  var sources = ['src/views/js/*.js',
    'src/styleguide/wskComponentHandler.js', 'src/styleguide/**/*.js'];
  console.log('scripts: sources=' + sources);
  return gulp.src(sources)
    .pipe($.concat('main.js'))
    .pipe(uglify({preserveComments: 'some'}))
    // Output Files
    .pipe(gulp.dest('dist/views/js'))
    .pipe($.size({title: 'scripts'}));
});

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function() {
  console.log('html: running');
  return gulp.src(['src/**/*.html'])
    .pipe(useref())
    // Remove Any Unused CSS
    // Note: If not using the Style Guide, you can delete it from
    // the next line to only include styles your project uses.
    // , 'src/styleguide.html'
    .pipe($.if('*.css', uncss({html: ['dist/index.html'],
      // CSS Selectors for UnCSS to ignore
      ignore: []
    })))

    // Concatenate And Minify Styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.csso()))
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    .pipe(inlinesource())
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

// Watch Files For Changes & Reload
gulp.task('serve', ['default'], function() {
  browserSync({
    notify: false,
    // Customize the BrowserSync console logging prefix
    logPrefix: 'WSK',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['.tmp', 'src']
  });

  gulp.watch(['src/**/*.html'], reload);
  gulp.watch(['src/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['src/**/*.js'], ['jshint']);
  gulp.watch(['src/**/*.png', 'src/**/*.jpg', 'src/**/*.jpeg'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function() {
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    //https: true,
    server: 'dist',
  });
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function(cb) {
  runSequence('styles', ['scripts','html','images', 'fonts', 'copy'], cb);
});

// Run PageSpeed Insights
// Update `url` below to the public URL for your site
gulp.task('pagespeed', pagespeed.bind(null, {
  // By default, we use the PageSpeed Insights
  // free (no API key) tier. You can use a Google
  // Developer API key if you have one. See
  // http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
  url: 'https://example.com',
  strategy: 'mobile'
}));

// Load custom tasks from the `tasks` directory
// try { require('require-dir')('tasks'); } catch (err) { console.error(err); }