const files = [
    "MathHelper.js",
    "Point3d.js",
    "SimulatedAnnealingStuff.js",
    "RodWithAnchors.js",
    "Panel.js",
    "main.js"
];
const SCRIPT_ROOT = "scripts"
const fileLoaded: {[key:string]: boolean} = {};

files.forEach((filename: string) => {
    fileLoaded[filename] = false;

    const loadFinishedCallback = () => {
        fileLoaded[filename] = true;
        const everythingLoaded: boolean = Object.keys(fileLoaded).reduce(
            (acc: boolean, file: string) => {
                return acc && fileLoaded[file];
            } , true
        );

        if(everythingLoaded) {
            start();
        }
    }

    const s = document.createElement("script");
    s.onload = loadFinishedCallback;
    s.onerror = loadFinishedCallback;
    s.src = SCRIPT_ROOT + "/" + filename;

    document.getElementsByTagName('body')[0].appendChild(s);
});

// function start() {
//     // ANY ACTUAL START CODE HERE
// }
