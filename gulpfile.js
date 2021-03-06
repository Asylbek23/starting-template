"use strict";

var gulp = require('gulp'),
		pug = require('gulp-pug'),
		sass = require('gulp-sass'),
		rupture = require('rupture'),
		concat = require('gulp-concat'),
		plumber = require('gulp-plumber'),
		rename = require('gulp-rename'),
		del = require('del'),
		prefix = require('gulp-autoprefixer'),
		imagemin = require('gulp-imagemin'),
		spritesmith = require("gulp.spritesmith"),
		browserSync = require('browser-sync').create();

var useref = require('gulp-useref'),
		gulpif = require('gulp-if'),
		cssmin = require('gulp-clean-css'),
		uglify = require('gulp-uglify'),
		rimraf = require('rimraf'),
		ftp = require('vinyl-ftp'),
		notify = require('gulp-notify');

var paths = {
			blocks: 'blocks/',
			assets: 'blocks/_assets/',
			vendors: {
				jquery: 'blocks/_assets/libs/jquery/dist/jquery.min.js'
			},
			devDir: 'app/',
			outputDir: 'acc/',
			sprite: 'app/img/sprite/'
		};


/*********************************
		Developer tasks
*********************************/

//pug compile
gulp.task('pug', function() {
	return gulp.src(paths.blocks + '*.pug')
		.pipe(plumber())
		.pipe(pug({pretty: true}))
		.pipe(gulp.dest(paths.devDir))
		.pipe(browserSync.stream())
});

//sass compile
gulp.task('sass', function() {
	return gulp.src(paths.blocks + 'template.sass')
		.pipe(sass())
		.pipe(prefix({
			browsers: ['last 15 versions'],
			cascade: true
		}))
		.pipe(rename('main.css'))
		.pipe(gulp.dest(paths.devDir + 'css/'))
		.pipe(browserSync.stream());
});

//js compile
gulp.task('scripts', function() {
	return gulp.src([
			paths.blocks + 'template.js',
			paths.blocks + '**/*.js',
			'!' + paths.assets + '**/*.js'
		])
		.pipe(concat('main.js'))
		.pipe(gulp.dest(paths.devDir + 'js/'))
		.pipe(browserSync.stream());
});

// sprite
gulp.task('cleansprite', function() {
    return del.sync(paths.sprite + 'sprite.png');
});

gulp.task('spritemade', function() {
    var spriteData =
        gulp.src(paths.sprite + '*.*')
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: '_sprite.sass',
            padding: 15,
            cssFormat: 'sass',
            algorithm: 'binary-tree',
            cssTemplate: 'sass.template.mustache',
            cssVarMap: function(sprite) {
                sprite.name = sprite.name;
            }
        }));

    spriteData.img.pipe(gulp.dest(paths.sprite)); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest(paths.blocks + '_assets/components')); // путь, куда сохраняем стили
});

gulp.task('sprite', ['cleansprite', 'spritemade']);


//watch
gulp.task('watch', function() {
	gulp.watch(paths.blocks + '**/*.pug', ['pug']);
	gulp.watch(paths.blocks + '**/*.sass', ['sass']);
	gulp.watch(paths.blocks + '**/*.js', ['scripts']);
});

//server
gulp.task('browser-sync', function() {
	browserSync.init({
		port: 3000,
		server: {
			baseDir: paths.devDir
		}
	});
});

/*********************************
 Copy assets to developer directory
 *********************************/

//copy vendors from blocks folders to devDir
gulp.task('vendors', function() {
	return gulp.src([
		paths.vendors.jquery
	])
		.pipe(gulp.dest(paths.devDir + 'js/libs/'));
});

//copy images from blocks folders to devDir
gulp.task('images', function() {
	return gulp.src([
		paths.blocks + '**/*.jpg',
		paths.blocks + '**/*.png',
		'!' + paths.assets + 'img/*.*'
	])
		.pipe(imagemin({progressive: true}))
		.pipe(gulp.dest(paths.devDir + 'img/'));
});

//copy fonts from blocks folders to devDir
gulp.task('fonts', function() {
	return gulp.src(paths.assets + 'fonts/*')
		.pipe(gulp.dest(paths.devDir + 'fonts/'));
});


/*********************************
		Production tasks
*********************************/

//clean
gulp.task('clean', function(cb) {
	rimraf(paths.outputDir, cb);
});

//css + js
gulp.task('build', ['clean'], function () {
	return gulp.src(paths.devDir + '*.html')
		.pipe( useref() )
		.pipe( gulpif('*.js', uglify()) )
		.pipe( gulpif('*.css', cssmin()) )
		.pipe( gulp.dest(paths.outputDir) );
});

//copy images to outputDir
gulp.task('imgBuild', ['clean'], function() {
	return gulp.src(paths.devDir + 'img/**/*.*')
		.pipe(gulp.dest(paths.outputDir + 'img/'));
});

//copy fonts outputDir
gulp.task('fontsBuild', ['clean'], function() {
	return gulp.src(paths.devDir + '/fonts/*')
		.pipe(gulp.dest(paths.outputDir + 'fonts/'));
});

//ftp
gulp.task('send', ['production'], function() {
	var conn = ftp.create( {
		host:     '77.120.110.166',
		user:     'alexlabs',
		password: 'Arj4h00F9x',
		parallel: 5
	} );

	/* list all files you wish to ftp in the glob variable */
	var globs = [
		'acc/**/*',
		'!node_modules/**' // if you wish to exclude directories, start the item with an !
	];

	return gulp.src( globs, { base: '.', buffer: false } )
		.pipe( conn.newer( '/public_html/' ) ) // only upload newer files
		.pipe( conn.dest( '/public_html/' ) )
		.pipe(notify("Dev site updated!"));

});

//run 'copy' task before 'develop' to include images and fonts to developing directory
//copy
gulp.task('copy', ['vendors', 'images', 'fonts']);

//develop
gulp.task('develop', ['browser-sync', 'watch', 'pug', 'sass', 'scripts']);

//production
gulp.task('production', ['build', 'imgBuild', 'fontsBuild']);

//default
gulp.task('default', ['develop']);
