const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const AdmZip = require("adm-zip");

const repo_url = "https://github.com/ta946/Soundcloud-Local";
const branch = "main";
const repo_version_url = `${repo_url}/blob/${branch}/version.txt?raw=true`;
const repo_package_json_url = `${repo_url}/blob/${branch}/node_files/package.json?raw=true`;
const repo_dl_url = `${repo_url}/archive/refs/heads/${branch}.zip`;
const temp_path = path.join(__dirname, "tmp");
const ignore_files = [
    // "config.js",
];

async function compare_local_file_to_remote(file_path, url) {
    const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
    });
    const new_data = await res.text();
    const current_data = fs.readFileSync(file_path, "utf8");
    const is_identical = new_data === current_data;
    return is_identical;
}

async function download_file(url, file_path) {
    const folder = path.dirname(file_path);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    const response = await fetch(url, {
        method: "GET",
    });
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(file_path, Buffer.from(buffer));
}

function delete_folder(folder) {
    if (!fs.existsSync(folder)) return;
    fs.rmSync(folder, { recursive: true, force: true });
}

function unzip(zip_path, output_path) {
    const zip = new AdmZip(zip_path);
    zip.extractAllTo(output_path, true);
}

function convert_ignore_files_to_absolute_paths(ignore_files, folder) {
    const ignore_files_abs_path = [];
    ignore_files.forEach(function (item) {
        const abs_path = path.join(folder, item);
        ignore_files_abs_path.push(abs_path);
    });
    return ignore_files_abs_path;
}

function copy_files_recursive(src_folder, dest_folder, ignore_files) {
    if (ignore_files === null || ignore_files === undefined) {
        ignore_files = [];
    }

    const files = fs.readdirSync(src_folder, {
        recursive: true,
        withFileTypes: true,
    });
    files.forEach((file) => {
        const abs_path = path.join(file.parentPath, file.name);
        if (file.isDirectory()) return;
        if (ignore_files.indexOf(abs_path) !== -1) {
            return;
        }
        const rel_path = path.relative(src_folder, abs_path);
        const dest_path = path.join(dest_folder, rel_path);
        fs.copyFileSync(abs_path, dest_path);
    });
}

function run_setup_dependancies() {
    let setup_dependancies_path;
    if (os.platform() === "win32") {
        setup_dependancies_path = path.join(
            __dirname,
            "../setup_dependancies.bat",
        );
    } else {
        setup_dependancies_path = path.join(
            __dirname,
            "../setup_dependancies.sh",
        );
    }
    try {
        execSync(setup_dependancies_path, [], {
            stdio: "pipe",
            encoding: "utf8",
        });
    } catch (err) {
        if (err.code) {
            console.error(err.code);
            return false;
        } else {
            const { stdout, stderr } = err;
            console.error({ stdout, stderr });
            return false;
        }
    }
    return true;
}

async function run_update() {
    const is_identical_version = await compare_local_file_to_remote(
        "../version.txt",
        repo_version_url,
    );
    if (is_identical_version) {
        console.log(`Soundcloud-Local is up-to-date!`);
        return;
    }
    console.log(`updating Soundcloud-Local..`);

    delete_folder(temp_path);
    zip_path = path.join(temp_path, "repo.zip");
    unzip_path = path.join(temp_path, "repo/");
    download_file(repo_dl_url, zip_path);
    unzip(zip_path, unzip_path);
    const temp_repo_path = path.join(unzip_path, `Soundcloud-Local-${branch}`);
    const repo_path = path.join(__dirname, "..");

    const ignore_files_abs_path = convert_ignore_files_to_absolute_paths(
        ignore_files,
        temp_repo_path,
    );
    copy_files_recursive(temp_repo_path, repo_path, ignore_files_abs_path);
    delete_folder(temp_path);

    const is_identical_package_json = await compare_local_file_to_remote(
        "../package.json",
        repo_package_json_url,
    );
    if (!is_identical_package_json) {
        run_setup_dependancies();
    }
    console.log("Soundcloud-Local updated.");
}

run_update();
