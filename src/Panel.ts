class Panel {
    points: Point3d[];

    constructor(rodA: RodWithAnchors, rodB: RodWithAnchors) {
        // Make sure the rods have the same # of points
        const maxLength: number = Math.max(rodB.points.length, rodA.points.length);
        rodA = rodA.rescale(maxLength);
        rodB = rodB.rescale(maxLength);

        this.points = [];
        this.points[0] = new Point3d(0,0,0);
        this.points[1] = new Point3d(0, rodA.points[0].dist(rodB.points[0]), 0);

        const a = (i) => i/2;
        const b = (i) => (i-1)/2;

        for(let i = 2; i < 2*maxLength; i++ ) {
            let p1: Point3d;
            let p2: Point3d;

            let np: Point3d;

            if(i%2 == 0) {
                p1 = rodA.points[a(i-2)];
                p2 = rodB.points[b(i-1)];
                np = rodA.points[a(i)];
            } else {
                p1 = rodB.points[b(i-2)];
                p2 = rodA.points[a(i-1)];
                np = rodB.points[b(i)];
            }

            const d1: number = np.dist(p1);
            const d2: number = np.dist(p2);

            const quadr = Point3d.onXYAtDistsFromTwoPoints(this.points[i-2], this.points[i-1], d1, d2);

            if(i > 3) {
                this.points[i] = this.points[i-3].dist(quadr[0]) > this.points[i-3].dist(quadr[1]) ? quadr[0] : quadr[1];
            } else {
                this.points[i] = quadr[0];
            }

            console.log(d1, d2, this.points[i]);

        }
    }
}