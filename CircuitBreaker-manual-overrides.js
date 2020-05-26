class CircuitBreaker {
  constructor(request, options = {}) {
    const defaults = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 6000
    };

    Object.assign(this, defaults, options, {
      request,
      state: "CLOSED",
      failureCount: 0,
      successCount: 0,
      nextAttempt: Date.now()
    });
  }

  async fire() {
    if (this.state === "OPEN") {
      if (this.nextAttempt <= Date.now()) {
        this.state = "HALF";
      } else {
        throw new Error("Breaker is OPEN");
      }
    }
    try {
      const response = await this.request();
      return this.success(response);
    } catch (err) {
      return this.fail(err);
    }
  }

  success(response) {
    if (this.state === "HALF") {
      this.successCount++;
      if (this.successCount > this.successThreshold) {
        this.close();
      }
    }
    this.failureCount = 0;

    this.status("Success");
    return response;
  }

  fail(err) {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
    this.status("Failure");
    return err;
  }

  open() {
    this.state = "OPEN";
    this.nextAttempt = Date.now() + this.timeout;
  }
  close() {
    this.successCount = 0;
    this.failureCount = 0;
    this.state = "CLOSED";
  }
  half() {
    this.state = "HALF";
  }

  status(action) {
    console.table({
      Action: action,
      Timestamp: Date.now(),
      Successes: this.successCount,
      Failures: this.failureCount,
      "Next State": this.state
    });
  }
}
module.exports = CircuitBreaker;
