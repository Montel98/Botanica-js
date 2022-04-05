export default class Branch {

	static maxAge = 1.0;
	static growthRate = 0.01;

	constructor(length, level) {

		this.branchLength = length;
		this.level = level;
		this.age = 0.0;
		this.branchId = null;
		this.isShoot = false; // Required for pruning to signal that branch is temporary
	}

	setBranchId(id) {
		
		this.branchId = id;
	}

	grow(worldTime) {

		let newAge = this.age + Branch.growthRate * worldTime.dt;

		if (newAge > Branch.maxAge) {

			newAge = Branch.maxAge;
		}

		this.age = newAge;
	}

	setAge(newAge) {

		this.age = newAge > Branch.maxAge ? Branch.maxAge : newAge;
	}

	setAsShoot() {

		this.isShoot = true;
	}

	isMaxAge() {

		return this.age == Branch.maxAge;
	}
}