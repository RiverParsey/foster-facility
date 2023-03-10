/* eslint-disable */
const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const sourcemap = require(`gulp-sourcemaps`);
const sass = require('gulp-sass')(require('sass'));
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const server = require(`browser-sync`).create();
const csso = require(`gulp-csso`);
const rename = require(`gulp-rename`);
const imagemin = require(`gulp-imagemin`);
const webp = require(`gulp-webp`);
const svgstore = require(`gulp-svgstore`);
const del = require(`del`);
const uglify = require(`gulp-uglify`);
const concat = require(`gulp-concat`);
const fileinclude = require(`gulp-file-include`);

gulp.task(`clean`, function () {
  return del(`docs`);
});

gulp.task(`copy`, function () {
  return gulp.src([
    `source/fonts/**/*.{woff,woff2}`,
    `source/favicon/**`,
    `source/img/**`,
    `source/*.webmanifest`,
    // `source/video/**`, // учтите, что иногда git искажает видеофайлы, pdf и gif - проверяйте и если обнаруживаете баги - скидывайте тестировщику такие файлы напрямую
    // `source/downloads/**`,
  ], {
    base: `source`,
  })
    .pipe(gulp.dest(`docs`));
});

gulp.task(`imagemin`, function () {
  return gulp.src(`source/img/**/*.{png,jpg}`)
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      }),
    ]))
    .pipe(gulp.dest(`docs/img`));
});

gulp.task(`webp`, function () {
  return gulp.src(`source/img/**/*.{png,jpg}`)
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest(`docs/img`));
});

gulp.task(`svgo`, function () {
  return gulp.src(`source/img/**/*.{svg}`)
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [{
          removeViewBox: false
        },
        {
          removeRasterImages: true
        },
        {
          removeUselessStrokeAndFill: false
        },
        ]
      }),
    ]))
    .pipe(gulp.dest(`source/img`));
});

gulp.task(`copysvg`, function () {
  return gulp.src(`source/img/**/*.svg`, {
    base: `source`
  })
    .pipe(gulp.dest(`docs`));
});

gulp.task(`sprite`, function () {
  return gulp.src(`source/img/sprite/*.svg`)
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename(`sprite_auto.svg`))
    .pipe(gulp.dest(`docs/img`));
});

gulp.task(`html`, function () {
  return gulp.src([`source/html/*.html`])
    .pipe(fileinclude({
      prefix: `@@`,
      basepath: `@root`,
      context: { // глобальные переменные для include
        test: `text`
      }
    }))
    .pipe(gulp.dest(`docs`));
});

gulp.task(`css`, function () {
  return gulp.src(`source/scss/style.scss`)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer({
      grid: true,
    })]))
    .pipe(gulp.dest(`docs/css`))
    .pipe(csso())
    .pipe(rename(`style.min.css`))
    .pipe(sourcemap.write(`.`))
    .pipe(gulp.dest(`docs/css`))
    .pipe(server.stream());
});

gulp.task(`script`, function () {
  return gulp.src([`source/js/*.js`])
    // .pipe(webpackStream(webpackConfig))
    .pipe(uglify())
    .pipe(gulp.dest(`docs/js`));
});

gulp.task(`copypngjpg`, function () {
  return gulp.src(`source/img/**/*.{png,jpg}`, {
    base: `source`
  })
    .pipe(gulp.dest(`docs`));
});

gulp.task('optimizesvg', gulp.series(`svgo`, 'copysvg', `sprite`));
// чтобы не нагружать сборку при самостоятельном добавлении изображений, вызывать optimizeimages вручную через "npm run optimizeimages"
gulp.task('optimizeimages', gulp.series(`imagemin`, `webp`));

gulp.task(`server`, function () {
  server.init({
    server: `docs/`,
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  gulp.watch(`source/html/**/*.html`, gulp.series(`html`, `refresh`));
  gulp.watch(`source/scss/**/*.{scss,sass}`, gulp.series(`css`));
  gulp.watch(`source/js/**/*.js`, gulp.series(`script`, `refresh`));
  gulp.watch(`source/img/**/*.svg`, gulp.series(`optimizesvg`, `html`, `refresh`));
  gulp.watch(`source/img/**/*.{png,jpg}`, gulp.series(`copypngjpg`, `html`, `refresh`));
});

gulp.task(`refresh`, function (done) {
  server.reload();
  done();
});

gulp.task(`build`, gulp.series(
  `clean`,
  gulp.parallel(
    `copy`,
    `optimizesvg`,
    `optimizeimages`,
  ),
  `html`,
  `css`,
  `script`
));

gulp.task(`start`, gulp.series(`build`, `server`));

// Optional tasks
//---------------------------------
// Вызывайте через `npm run taskName`

// для отправки заказчику неминифицированного js "для чтения"
gulp.task(`concat-js`, function () {
  return gulp.src([`source/js/main.js`, `source/js/utils/**/*.js`, `source/js/modules/**/*.js`])
    .pipe(concat(`main.readonly.js`))
    .pipe(gulp.dest(`docs/js`));
});

// для ускоренного запуска без оптимизации размера изображений.
gulp.task('faststart', gulp.series(
  `clean`,
  gulp.parallel(
    `copy`,
    `optimizesvg`,
    `copypngjpg`,
    `webp`
  ),
  `html`,
  `css`,
  `script`,
  `server`
));
