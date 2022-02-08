const seed = [52095,6399065,193205,500599];

const randomFloat = sfc32(...seed);

export default function sfc32(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

function modExp (a, b, n) {
    a = a % n;
    var result = 1n;
    var x = a;
    while (b > 0) {
        var leastSignificantBit = b % 2n;
        b = b / 2n;
        if (leastSignificantBit == 1n) {
            result = result * x;
            result = result % n;
        }
        x = x * x;
        x = x % n;
    }
    return result;
};

export class LCG {

  static multiplier = 1079;
  static modulus = (2**24) - 1;
  static addend = 1;

  constructor(seed) {
    this.a = BigInt(LCG.multiplier);
    this.b = BigInt(LCG.addend);
    this.m = BigInt(LCG.modulus);
    this.x = BigInt(seed);

    this.it = this.sequence();
  }

  randomFloat() {

    return this.it.next().value;
  }

  *sequence() {

    while (true) {

      this.x = ((this.a * this.x + this.b) % this.m);

      yield parseInt(this.x) / parseInt(this.m);

    }
  }

  skip(step) {

    const n = BigInt(step);

    let a1 = this.a - 1n;
    let ma = a1 * this.m;
    let y = (modExp(this.a, n, ma) - 1n) / (a1 * this.b);
    let z = modExp(this.a, n, this.m)*this.x;

    this.x = ((y + z) % this.m);
  }
}