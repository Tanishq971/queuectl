import { exec } from "child_process";
function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error)
                reject(error);
            resolve();
        });
    });
}
//To run commands
export default runCommand;
//# sourceMappingURL=exec.js.map