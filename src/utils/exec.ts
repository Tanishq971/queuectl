import { exec } from "child_process";

function runCommand (command : string) : Promise<void>{
    return new Promise((resolve , reject)=>{
        exec(command , (error)=>{
            if(error) reject(error);
            resolve();
        })
    })
}

//To run commands

export default runCommand;