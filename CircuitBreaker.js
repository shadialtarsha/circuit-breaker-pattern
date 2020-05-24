class CircuitBreaker {
  constructor(request) {
    this.request = request
    this.state = "CLOSED"
    this.failureThreshold = 3
    this.failureCount = 0
    this.successThreshold = 2
    this.successCount = 0
    this.timeout = 6000
    this.nextAttempt = Date.now()
  }

  async fire() {
    if (this.state === "OPEN") {
      if (this.nextAttempt <= Date.now()) {
        this.state = "HALF"
      } else {
        throw new Error("Circuit is currently OPEN")
      }
    }
    // The state is CLOSED or HALF
    try {
      const response = await this.request()
      return this.success(response)
    } catch (err) {
      return this.fail(err)
    }
  }

  success(response) {
    // This method doesn't check for OPEN because the OPEN state can never send a request.
    if (this.state === "HALF") {
      this.successCount++;
      if (this.successCount > this.successThreshold) {
        this.successCount =0
        this.state = "CLOSED"
      }
    }

    this.failureCount = 0;
    this.status("Success");
    return response;
  }

  fail(err) {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      // This sets up our OPEN state and prevents any request from being made until the timeout period has passed.
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.timeout;
    }

    this.status("Failure");
    return err;
  }

  status(action) {
    console.table({
      Action: action,
      Timestamp: Date.now(),
      Successes: this.successCount,
      Failures: this.failureCount,
      State: this.state
    });
  }
}

module.exports = CircuitBreaker;