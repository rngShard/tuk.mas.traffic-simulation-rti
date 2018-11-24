import time
from random import choice
from event_agent import EventAgent
from supervisor_agent import SupervisorAgent
from traveller_agent import TravellerAgent

NUM_AGENTS = 50
NETWORK = "../data/graphs/test_graph30_2.json"
AGENT_TYPES = ["local", "global"]

if __name__ == "__main__":

    receiveragent = SupervisorAgent("supervisor@localhost", "test", NETWORK)
    receiveragent.start()

    eventagent = EventAgent("eventmanager@localhost", "test", NETWORK)
    eventagent.start()

    agents = [TravellerAgent(f"test{i}@localhost", "test",NETWORK , 1,
                             choice(AGENT_TYPES), 8, 0) for i in range(NUM_AGENTS)]
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
