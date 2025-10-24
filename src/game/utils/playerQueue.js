class PlayerQueue {
  constructor(players = []) {
    this.maxPlayers = 5;
    
    if (players.length > this.maxPlayers) {
      throw new Error(`Cannot have more than ${this.maxPlayers} players. Received ${players.length} players.`);
    }
    
    this.originalPlayers = [...players];
    this.queue = [];
    this.currentOrder = [];
    this.isInitialized = false;
    
    if (players.length > 0) {
      this.initializeOrder();
    }
  }

  initializeOrder() {
    this.currentOrder = this.shufflePlayers([...this.originalPlayers]);
    this.queue = [...this.currentOrder];
    this.isInitialized = true;
  }

  shufflePlayers(players) {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getNextPlayer() {
    if (this.queue.length === 0) {
      this.refillQueue();
    }
    
    return this.queue.shift();
  }

  peekNextPlayer() {
    if (this.queue.length === 0) {
      this.refillQueue();
    }
    
    return this.queue[0] || null;
  }

  refillQueue() {
    if (!this.isInitialized) {
      this.currentOrder = this.shufflePlayers([...this.originalPlayers]);
      this.isInitialized = true;
    }
    this.queue = [...this.currentOrder];
  }

  addPlayer(player) {
    if (this.originalPlayers.length >= this.maxPlayers) {
      throw new Error(`Cannot add player. Maximum of ${this.maxPlayers} players allowed. Current count: ${this.originalPlayers.length}`);
    }
    
    this.originalPlayers.push(player);
    if (this.queue.length > 0) {
      const randomIndex = Math.floor(Math.random() * (this.queue.length + 1));
      this.queue.splice(randomIndex, 0, player);
    }
  }

  removePlayer(player) {
    this.originalPlayers = this.originalPlayers.filter(p => p !== player);
    this.queue = this.queue.filter(p => p !== player);
    this.currentOrder = this.currentOrder.filter(p => p !== player);
  }

  getCurrentOrder() {
    return [...this.currentOrder];
  }

  getRemainingQueue() {
    return [...this.queue];
  }

  getPlayerCount() {
    return this.originalPlayers.length;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  reset() {
    this.isInitialized = false;
    this.initializeOrder();
  }

  canAddMorePlayers() {
    return this.originalPlayers.length < this.maxPlayers;
  }

  getMaxPlayers() {
    return this.maxPlayers;
  }

  getAvailableSlots() {
    return this.maxPlayers - this.originalPlayers.length;
  }
}

export default PlayerQueue;