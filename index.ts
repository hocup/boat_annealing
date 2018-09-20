class Point3d {
    
    constructor(public x: number, public y: number, public z: number) {}

    dotProduct(other: Point3d): number {
        return other.x*this.x + other.y*this.y + other.z*this.z;
    }

    length(): number {
        return Math.sqrt(this.dotProduct(this));
    }

    normal(): Point3d {
        let len = this.length();
        if(len > 0) {
            return new Point3d(this.x/len, this.y/len, this.z/len);
        }
    }

    rotateAroundZ(angle: number): Point3d {
        return new Point3d(
            this.x*Math.cos(angle) - this.y*Math.sin(angle),
            this.x*Math.sin(angle) + this.y*Math.cos(angle),
            0
        );
    }

    rotateAtPoint(point: Point3d, axis: Point3d, angle: number) {
        return this.add(point.scale(-1)).rotate(axis, angle).add(point);
    }

    rotate(axis: Point3d, angle: number): Point3d {
        // Thanks wikipedia!
        // https://en.wikipedia.org/wiki/Rotation_matrix
        let n = axis.normal();
        let x = 
                this.x*(Math.cos(angle)  + Math.pow(n.x, 2)*(1 - Math.cos(angle)))
                + this.y*(n.x*n.y*(1 - Math.cos(angle)) - n.z*Math.sin(angle))
                + this.z*(n.x*n.z*(1 - Math.cos(angle)) + n.y*Math.sin(angle));
        let y = 
                this.x*(n.x*n.y*(1 - Math.cos(angle)) + n.z*Math.sin(angle))
                + this.y*(Math.cos(angle) + n.y*n.y*(1 - Math.cos(angle)))
                + this.z*(n.y*n.z*(1 - Math.cos(angle)) - n.x*Math.sin(angle));
        let z = 
                this.x*(n.z*n.x*(1 - Math.cos(angle)) - n.y*Math.sin(angle))
                + this.y*(n.z*n.y*(1 - Math.cos(angle)) + n.x*Math.sin(angle))
                + this.z*(Math.cos(angle) + n.z*n.z*(1 - Math.cos(angle)));
        return new Point3d(x, y, z);
    }

    clone() : Point3d {
        return new Point3d(this.x, this.y, this.z);
    }

    scale(scale: number): Point3d {
        return new Point3d(this.x*scale, this.y*scale, this.z*scale);
    }

    add(other: Point3d): Point3d {
        return new Point3d(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    dist(other: Point3d): number {
        return this.add(other.scale(-1)).length();
    }

    distToSegment(a: Point3d, b: Point3d): number {
        let ab: Point3d = b.add(a.scale(-1));
        let ap: Point3d = this.add(a.scale(-1));

        let projection = ap.dotProduct(ab.normal());

        if(projection >= ab.length()) {
            return b.dist(this);
        } else if(projection <= 0) {
            return a.dist(this);
        } else {
            return Math.sqrt(ap.dotProduct(ap) - Math.pow(projection, 2));
        }
    }

}

interface IState {

    // Implementation should return some random neighbor of the state
    neighbor(): IState; 

    // Implementation should return the energy of the state
    energy(): number;
}

class RodWithAnchors implements IState{
    constructor(
        public points: Point3d[], 
        public anchors: Point3d[], 
        public rodStiffness: number = 50, 
        public anchorStiffness: number = 100
    ) {

    }

    neighbor(): RodWithAnchors {
        const clonePoints = this.points.map(p => {return p.clone();});
        const cloneAnchors = this.anchors.map(a => {return a.clone();});

        let clone = new RodWithAnchors(clonePoints, cloneAnchors, this.rodStiffness, this.anchorStiffness)

        const tweakAngle = 0.01*MathHelper.boxMullerGaussian()[0];
        const tweakIndex = Math.floor(Math.random()*(this.points.length-1));
        const pivotAxis = this.points[tweakIndex+1].add(this.points[tweakIndex].scale(-1)); //TODO: confirm
        const pivot = this.points[tweakIndex];
        const pivotForward = Math.random() > 0.5;

        const axisXsrd= (Math.pow(pivotAxis.y,2)/(Math.pow(pivotAxis.x, 2) + Math.pow(pivotAxis.y,2)));

        var tweakAxis: Point3d = new Point3d(
            Math.sqrt(axisXsrd),
            Math.sqrt(1-axisXsrd),
            0
        )

        tweakAxis = tweakAxis.rotate(pivotAxis, Math.PI*2*Math.random());

        clone.points = this.points.map(
            (p: Point3d,index: number) => {
                if(pivotForward && index > tweakIndex) {
                    return p.rotateAtPoint(pivot, tweakAxis, tweakAngle);
                }
                
                if(!pivotForward && index < tweakIndex) {
                    return p.rotateAtPoint(pivot, tweakAxis, tweakAngle);
                }

                return p;
            }
        );


        return clone;
    }

    energy() {
        let rodEnergy = 0;
        for(let i = 2; i < this.points.length; i++) {
            const segA: [Point3d, Point3d] = [this.points[i-2], this.points[i-1]];
            const segB: [Point3d, Point3d] = [this.points[i-1], this.points[i]];

            rodEnergy += this.rodStiffness*Math.pow(MathHelper.angleBetweenTwoSegments(segA, segB), 2);
        }

        

        const anchorEnergy = this.anchors.reduce(
            (acc, anch: Point3d) => {
                let shortestDist = Infinity;
                for(let i = 1; i < this.points.length; i++) {
                    const testDist = anch.distToSegment(this.points[i-1], this.points[i]);
                    if(testDist < shortestDist) {
                        shortestDist = testDist;
                    }
                }
                return acc + this.anchorStiffness*Math.pow(shortestDist,2);
            }, 0
        );

        // console.log("Rod energy: " + rodEnergy + " Anchor energy: " + anchorEnergy);
        return anchorEnergy + rodEnergy;
    }

    clipToAnchors(): RodWithAnchors {
        let outPoints = this.points;

        let startIndex = 0;
        let endIndex = 0;
        let startDist = Number.POSITIVE_INFINITY;
        let endDist = Number.POSITIVE_INFINITY;
        for(let i = 0; i < this.points.length; i++) {
            let testDistStart = this.anchors[0].dist(this.points[i]);
            let testDistEnd = this.anchors[this.anchors.length - 1].dist(this.points[i]);
            if(testDistStart < startDist) {
                startIndex = i;
                startDist = testDistStart;
            }

            if(testDistEnd < endDist) {
                endIndex = i;
                endDist = testDistEnd;
            }
        }

        outPoints = this.points.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex));

        return new RodWithAnchors(outPoints, this.anchors, this.rodStiffness, this.anchorStiffness);
    }

    rescale(numPoints: number): RodWithAnchors { 
        let outPoints = [];
        for(let i = 0; i < numPoints; i++) {
            const pos = this.points.length*i/numPoints;
            const pA = this.points[Math.floor(pos)];
            const pB = this.points[Math.floor(pos+1)];
            const remainder = pos % 1;
            const newP = pA.scale(1 - remainder).add(pB.scale(remainder));
            outPoints.push(newP);
        }
        return new RodWithAnchors(outPoints, this.anchors, this.rodStiffness, this.anchorStiffness);
    }
}

class SimulatedAnnealingManager<State extends IState> {
    
    public currentStep: number = 0;

    public stateEnergy: number;

    constructor(
        public state: State, 
        public maxSteps: number = 10000,
        public annealingSchedule?: (n: number) => number,
        public transitionProb?: (eOld: number, eNew: number, temp: number) => number
    ){
        // This seems neater than putting these functions in the default params
        if(!this.annealingSchedule) {
            this.annealingSchedule = (n: number) => {
                if(n == 0) {
                    return Infinity;
                } else {
                    return 1/n - 1;
                }
            }
        }

        if(!this.transitionProb) {
            this.transitionProb = (eOld: number, eNew: number, temp: number) => {
                if(eOld > eNew || temp == Infinity) {
                    return 1;
                } else if(temp == 0){
                    return 0;
                } else {
                    return Math.exp(-(eNew - eOld)/temp);
                }
            }
        }
    }

    step(): void {
        if(this.maxSteps <= this.currentStep)
            return;

        let temp = this.annealingSchedule(this.currentStep/this.maxSteps);
        let testState: State = <State> this.state.neighbor();
        let eNow = this.stateEnergy ? this.state.energy() : this.stateEnergy;
        let eNew = testState.energy();

        let transProb = this.transitionProb(eNow, eNew, temp);

        if(transProb >= Math.random()) {
            this.state = testState;
            this.stateEnergy = eNew;
        }

        this.currentStep++;
    }

    
}

class MathHelper {
    static angleBetweenTwoSegments(segA: [Point3d, Point3d], segB: [Point3d, Point3d]) {
        const nA = segA[1].add(segA[0].scale(-1)).normal();
        const nB = segB[1].add(segB[0].scale(-1)).normal();
        const cosB = nA.dotProduct(nB);
        if(cosB > 1) {
            // Sometimes, the projection is close to 1, but not quite
            return 0;
        }

        if(cosB < -1) {
            return Math.PI;
        }
        // const translatedB = segB[1].add(segA[0].scale(-1))
        // const cosB = translatedB.dotProduct(nA);
        // const sinB = Math.sqrt(Math.abs(Math.pow(translatedB.length(),2) - Math.pow(cosB, 2)));

        return Math.acos(cosB);
    }

    static boxMullerGaussian() : [number, number] {
        let out: [number, number] = [0,0];

        let u1 = Math.random();
        let u2 = Math.random();

        out[0] = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
        out[1] = Math.sqrt(-2*Math.log(u1)) * Math.sin(2*Math.PI*u2);

        return out;
    }
}

let saManagers: SimulatedAnnealingManager<RodWithAnchors>[] = [];

let topDownViewContext: CanvasRenderingContext2D;
let sideViewContext: CanvasRenderingContext2D;
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


    let anchors: Point3d[][] = [
        [
            new Point3d(-100,0,10),
            new Point3d(0,29,10),
            new Point3d(100,0,10),
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
        for(let i = 0; i < rodLength; i++) {
            points.push(new Point3d(0.5*step*rodLength - step*i, 0, -10));
        }

        let startRod = new RodWithAnchors(points, anchors[i], 70, 300);
        saManagers[i] = new SimulatedAnnealingManager<RodWithAnchors>(startRod, 7500);
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
        // saManager = new SimulatedAnnealingManager<RodWithAnchors>(saManager.state);
        // takeStep();
    }
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
        // if(rod.points[i].y > 0) {
        //     drawContext.lineTo(p[0] + cWidth/2, p[1] + cHeight/2);
        // } else {
        //     drawContext.moveTo(p[0] + cWidth/2, p[1] + cHeight/2);
        // }

        drawContext.lineTo(p[0] + cWidth/2, p[1] + cHeight/2);
    }
    drawContext.stroke();

    drawContext.fillStyle = "blue";
    for(let i = 0; i < rod.anchors.length; i++) {
        p = projectionFunction(rod.anchors[i]);
        drawContext.fillRect(p[0] + cWidth/2 - 2, p[1] + cHeight/2 - 2, 4, 4);
    }

}
