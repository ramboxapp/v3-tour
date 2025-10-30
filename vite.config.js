const vue = require("@vitejs/plugin-vue");
const copy = require("rollup-plugin-copy");
const path = require("path");

module.exports = {
	outDir: "dist",
	publicDir: "public-vite",
	plugins: [
		vue(),
		copy({
			targets: [
				{
					src: "dist/v3-tour.umd.js",
					dest: "public",
					rename: "vue-tour.umd.js"
				},
				{ src: "dist/vue-tour.css", dest: "public" }
			],
			hook: "writeBundle"
		})
	],
	build: {
		optimizeDeps: {
			exclude: ["public"]
		},
		lib: {
			entry: path.resolve(__dirname, "src/main.js"),
			name: "VueTour",
			fileName: format =>
				format === "es" ? "v3-tour.es.js" : "v3-tour.umd.js"
		},
		rollupOptions: {
			external: ["vue"],
			output: [
				{
					assetFileNames: "vue-tour.css",
					format: "es",
					globals: {
						vue: "Vue"
					}
				},
				{
					assetFileNames: "vue-tour.css",
					format: "umd",
					globals: {
						vue: "Vue"
					}
				}
			]
		}
	}
};
