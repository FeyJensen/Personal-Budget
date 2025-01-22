export class Envelope {
    constructor(name, budget, id) {
      this.name = name;
      this.budget = budget;
      this.id = id;
    }


    details(){
      console.log(`This ${this.name} envelope has $ ${this.budget}`);
    }

    
}