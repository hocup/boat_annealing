
interface IState {

    // Implementation should return some random neighbor of the state
    neighbor(): IState; 

    // Implementation should return the energy of the state
    energy(): number;
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