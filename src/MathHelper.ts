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

    static quadraticEq(a, b, c): [number, number] {
        // For equtns of form a*x^2 + b*x + c = 0
        // console.log("quadding", a, b, c, b**2 - 4*a*c)
        const sqrtTerm = Math.sqrt(b**2 - 4*a*c);
        return [(-b + sqrtTerm)/(2*a), (-b - sqrtTerm)/(2*a)];
    }
}