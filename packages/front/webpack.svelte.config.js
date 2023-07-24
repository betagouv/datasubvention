require("dotenv/config");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const { DefinePlugin } = require("webpack");

const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";

module.exports = {
    entry: {
        "build/bundle": ["./svelte/main.js"],
    },
    resolve: {
        alias: {
            svelte: path.dirname(require.resolve("svelte/package.json")),
            "@resources": path.resolve(__dirname, "svelte/resources"),
            "@components": path.resolve(__dirname, "svelte/components"),
            "@dsfr": path.resolve(__dirname, "svelte/dsfr"),
            "@core": path.resolve(__dirname, "svelte/core"),
            "@services": path.resolve(__dirname, "svelte/services"),
            "@helpers": path.resolve(__dirname, "svelte/helpers"),
            "@store": path.resolve(__dirname, "svelte/store"),
        },
        extensions: [".mjs", ".js", ".svelte", ".ts"],
        mainFields: ["svelte", "module", "main"],
    },
    output: {
        path: path.join(__dirname, "/static/js"),
        filename: "svelte.js",
        // chunkFilename: '[name].[id].js'
    },
    module: {
        rules: [
            {
                test: /\.svelte$/,
                use: {
                    loader: "svelte-loader",
                    options: {
                        compilerOptions: {
                            dev: !prod,
                        },
                        emitCss: prod,
                        hotReload: !prod,
                    },
                },
            },
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: [/node_modules/],
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
            {
                // required to prevent errors from Svelte on Webpack 5+
                test: /node_modules\/svelte\/.*\.mjs$/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.svg$/,
                loader: "svg-inline-loader",
            },
        ],
    },
    mode,
    plugins: [
        new DefinePlugin({
            "process.env": JSON.stringify({
                DATASUB_URL: process.env.DATASUB_URL,
                ENV: process.env.ENV,
                STATS_URL: process.env.STATS_URL,
                PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL,
            }),
        }),
        new MiniCssExtractPlugin({
            filename: "../css/svelte.css",
        }),
    ],
    devtool: prod ? false : "source-map",
};
