class Point3d {
    
    constructor(public x: number, public y: number, public z: number) {}

    static onXYAtDistsFromTwoPoints(A: Point3d, B: Point3d, dA: number, dB: number) {
        
        // A and B should already by on the XY plane
        const At: Point3d = A.add(B.scale(-1));
        if(At.x !== 0) {
            const R: number = -At.y/At.x;
            const Beta: number = ((dB**2 - dA**2) + (At.x **2 + At.y**2))/(2*At.x);

            const Cty = MathHelper.quadraticEq(1 + R**2, 2*Beta*R, Beta**2 - dB**2);

            return Cty.map(Cy => {
                const Cx = R*Cy + Beta;
                return new Point3d(Cx, Cy, 0).add(B);
            });
        } else if (At.y !== 0) {
            const Cty = (dA**2 - dB**2 - At.y**2)/(-2*At.y);
            const Ctx = Math.sqrt(dB**2 - Cty**2);
            return [
                new Point3d(Ctx, Cty, 0).add(B),
                new Point3d(-Ctx, Cty, 0).add(B),
            ]
        } else {
            return [ 
                new Point3d(dA, 0, 0).add(B), 
                new Point3d(-dA, 0, 0).add(B) ];
        }
    }

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