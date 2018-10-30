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
            const pB = this.points[Math.floor(Math.min(pos+1, this.points.length -1))];
            const remainder = pos % 1;
            const newP = pA.scale(1 - remainder).add(pB.scale(remainder));
            outPoints.push(newP);
        }
        return new RodWithAnchors(outPoints, this.anchors, this.rodStiffness, this.anchorStiffness);
    }
}