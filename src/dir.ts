import { fsRestricted } from "./fsHelper";


export const fileExists = () => {
    const fs = fsRestricted(["/"])
    console.log(fs.readdirSync("/home/aalexeev"))
    console.log(fs.existsSync('/etc/config/file.dat'))
    return fs.existsSync('/etc/config/file.dat')
}
