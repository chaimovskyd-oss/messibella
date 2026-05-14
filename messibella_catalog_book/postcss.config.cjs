module.exports = {
  plugins: (() => {
    const p = [];
    try {
      // autoprefixer is optional; include if available
      // don't require tailwind here to avoid throwing when not installed
      p.push(require('autoprefixer'));
    } catch (err) {
      // ignore missing autoprefixer
    }
    return p;
  })(),
};
