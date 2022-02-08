export class FourierTerm {
    constructor(sinMag, cosMag, n, sharpness) {
        this.sinMagnitude = sinMag;
        this.cosMagnitude = cosMag;
        this.angularFreq = n;
        this.attenuation = sharpness;
    }

    eval(x) {
        let cosComponent = this.cosMagnitude * (Math.cos(this.angularFreq * x) ** this.attenuation);
        let sinComponent = this.sinMagnitude * (Math.sin(this.angularFreq * x) ** this.attenuation);
        
        return cosComponent + sinComponent;
    }
}

export class FourierSeries {
    constructor(a0, terms) {
        this.a0 = a0; // The first (constant) term
        this.terms = terms; // List of all sinusoidal terms
    }

    sum(x) {
        
        // Sum of all sinusoidal terms
        return this.terms.reduce((total, term) => {return total + term.eval(x)} , this.a0);
    }
    
}