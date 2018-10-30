let saManagers: SimulatedAnnealingManager<RodWithAnchors>[] = [];

let topDownViewContext: CanvasRenderingContext2D;
let sideViewContext: CanvasRenderingContext2D;

let flattenedContexts: CanvasRenderingContext2D[] = [];

let sideViewProjection = (p: Point3d): [number, number] => [p.x, -p.z];
let cHeight: number;
let cWidth: number;

let startTime: Date;

function start() {
    console.log("I HAVE BEGUN");
    startTime = new Date();
    const canvasElementA: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("rodCanvasA");
    topDownViewContext = canvasElementA.getContext("2d"); 
    cHeight = canvasElementA.height;
    cWidth = canvasElementA.width;

    const canvasElementB: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("rodCanvasB");
    sideViewContext = canvasElementB.getContext("2d"); 
    // cHeight = canvasElementB.height;
    // cWidth = canvasElementB.width;


    flattenedContexts.push(
        (<HTMLCanvasElement> document.getElementById("rodCanvasC")).getContext("2d")
    );
    flattenedContexts.push(
        (<HTMLCanvasElement> document.getElementById("rodCanvasD")).getContext("2d")
    );
    flattenedContexts.push(
        (<HTMLCanvasElement> document.getElementById("rodCanvasE")).getContext("2d")
    );

    let anchors: Point3d[][] = [
        [
            new Point3d(-100,0,15),
            new Point3d(0,29,10),
            new Point3d(100,0,15),
        ],
        [
            new Point3d(-105, 0, 0),
            new Point3d(0, 29.2, 0),
            new Point3d(105, 0, 0)
        ],
        [
            new Point3d(-50,0,-10),
            new Point3d(0,10,-10),
            new Point3d(50,0,-10),
        ]
    ];

    anchors = anchors.map(
        (a) => {
            return a.map(
                (p) => {
                    return p.scale(0.75);
                }
            );
        }
    )

    for(let i = 0; i < anchors.length; i++) {
        let rodLength = 80;
        const step = 200/rodLength;
        const points: Point3d[] = [];
        for(let j = 0; j < rodLength; j++) {
            points.push(new Point3d(0.5*step*rodLength - step*j, 0, anchors[i][0].z));
        }

        let startRod = new RodWithAnchors(points, anchors[i], 70, 300);
        saManagers[i] = new SimulatedAnnealingManager<RodWithAnchors>(startRod, 1000/*7500*/);
    }

    takeStep();
}

function takeStep() {
    if(saManagers[0].currentStep%10 === 0) {
        // console.log(saManager.currentStep/saManager.maxSteps, saManager.stateEnergy);
        clearCanvas(topDownViewContext);
        clearCanvas(sideViewContext)
        for(let i = 0; i < saManagers.length; i++) {
            let saManager = saManagers[i];
            drawRod(saManager.state.clipToAnchors(), topDownViewContext);
            drawRod(saManager.state.clipToAnchors(), sideViewContext, sideViewProjection);
        }
        
    }

    if(saManagers[0].currentStep < saManagers[0].maxSteps) {
        for (let smk in saManagers) saManagers[smk].step();
        window.requestAnimationFrame(takeStep);
        
    } else {
        console.log("DONE");
        const aPanel = new Panel(saManagers[1].state.clipToAnchors(), saManagers[2].state.clipToAnchors());
        const bPanel = new Panel(saManagers[0].state.clipToAnchors(), saManagers[1].state.clipToAnchors());
        const cPanel = new Panel(
            saManagers[2].state.clipToAnchors(),
            new RodWithAnchors(saManagers[2].state.clipToAnchors().points.map(p => new Point3d(p.x, -p.y, p.z)), [], 0, 0)
        )

        drawPanel(aPanel, flattenedContexts[0]);
        drawPanel(bPanel, flattenedContexts[1]);
        drawPanel(cPanel, flattenedContexts[2]);


        // saManager = new SimulatedAnnealingManager<RodWithAnchors>(saManager.state);
        // takeStep();
    }
}

function drawPanel(panel: Panel, context: CanvasRenderingContext2D) {
    const splitRods = panel.points.reduce((acc, p, index) => {
        acc[index %2].push(p);
        return acc;
    }, [[],[]]);

    splitRods[1].push(splitRods[0][splitRods[0].length - 1]);
    splitRods[0].unshift(splitRods[1][0]);

    const panelRods = [
        new RodWithAnchors(splitRods[0], [], 0, 0),
        new RodWithAnchors(splitRods[1], [], 0, 0)
    ]
    drawRod(panelRods[0], context);
    drawRod(panelRods[1], context);
}

function clearCanvas(drawContext: CanvasRenderingContext2D) {
     // // Clear the canvas
    drawContext.fillStyle = "white";
    drawContext.fillRect(0, 0, cWidth, cHeight);
}

function drawRod(rod: RodWithAnchors, drawContext: CanvasRenderingContext2D, projectionFunction?: (Point3d) => [number, number]) {
    // TODO: cWidth and cHeight are not canvas-dependant yet
    if(!projectionFunction) {
        projectionFunction = (p: Point3d) => {
            return [p.x, -p.y];
        }
    }

    drawContext.beginPath();

    let p = projectionFunction(rod.points[0]);
    drawContext.moveTo(p[0] + cWidth/2, p[1] + cHeight/2);
    for(let i = 0; i < rod.points.length; i++) {
        p = projectionFunction(rod.points[i]);
        drawContext.lineTo(p[0] + cWidth/2, p[1] + cHeight/2);
    }
    drawContext.stroke();

    drawContext.fillStyle = "blue";
    for(let i = 0; i < rod.anchors.length; i++) {
        p = projectionFunction(rod.anchors[i]);
        drawContext.fillRect(p[0] + cWidth/2 - 2, p[1] + cHeight/2 - 2, 4, 4);
    }

}
