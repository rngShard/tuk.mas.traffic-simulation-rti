import time
from random import choice
from backend.event_agent import EventAgent
from backend.supervisor_agent import SupervisorAgent
from backend.traveller_agent import TravellerAgent

NUM_AGENTS = 50
AGENT_TYPES = ["local", "global"]

if __name__ == "__main__":

    receiveragent = SupervisorAgent("supervisor@localhost", "test")
    receiveragent.start()

    eventagent = EventAgent("eventmanager@localhost", "test")
    eventagent.start()

    agents = [TravellerAgent(f"test{i}@localhost", "test", 1, choice(AGENT_TYPES)) for i in range(NUM_AGENTS)]
    print("Travellers loaded")
    for i in agents:
        i.start()

    while receiveragent.is_alive():
        try:
            time.sleep(0.01)
        except KeyboardInterrupt:
            for i in agents:
                i.stop()
            eventagent.stop()
            receiveragent.stop()
            break
    print("Agents finished")
