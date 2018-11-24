import datetime

from spade.agent import Agent
from spade.behaviour import PeriodicBehaviour
from traveller_agent import TravellerAgent
from event_manager import EventManager
from util import build_message, get_timestamp

SUPERVISOR_AGENT = "supervisor@localhost"


class EventAgent(Agent):
    class EventBehav(PeriodicBehaviour):
        async def run(self):
            print(f"PeriodicSenderBehaviour running at {datetime.datetime.now().time()}: {self.counter}")
            event = self.agent.event_manager.get_random_event()
            if event == "road_works_start":
                edge, factor = self.agent.event_manager.road_works()
                ts = get_timestamp()
                msg = build_message("inform", "event_road_works_start", self.agent.name,
                                    f"{ts}|{edge[0]}|{edge[1]}|{factor}", SUPERVISOR_AGENT)
                self.agent.event_manager.construction_sites.add(edge)
                await self.send(msg)
                self.counter += 1
            if event == "road_works_end":
                ts = get_timestamp()
                try:
                    edge = self.agent.event_manager.construction_sites.pop()
                    msg = build_message("inform", "event_road_works_end", self.agent.name,
                                        f"{ts}|{edge[0]}|{edge[1]}|1", SUPERVISOR_AGENT)
                    await self.send(msg)
                    self.counter += 1
                except KeyError:
                    pass

            if event == "spawn_random_agents":
                num_agents = range(self.agent.event_manager.get_random_num_agents())
                agents = []
                for _ in num_agents:
                    num = self.agent.event_manager.inc_agent_counter()
                    agents.append(TravellerAgent(f"eventtest{num}@localhost", "test",
                                                 self.agent.event_manager.graph, 1,
                                                 loop=self.agent.loop))
                for agent in agents:
                    print("EventAgent start!")
                    await agent.async_start()
            if event == "spawn_agents":
                num_agents, start_node, destination_node = self.agent.event_manager.spawn_agents()
                agents = []
                for _ in range(num_agents):
                    num = self.agent.event_manager.inc_agent_counter()
                    agents.append(
                        TravellerAgent(f"eventtest{num}@localhost", "test", self.agent.event_manager.graph, 1,
                                       start_node, destination_node,
                                       loop=self.agent.loop))
                for agent in agents:
                    print("EventAgent start!")
                    await agent.async_start()
                self.counter += 1
            if self.counter == 10:
                self.kill()

        async def on_end(self):
            # stop agent from behaviour
            self.agent.stop()

        async def on_start(self):
            self.counter = 0

    def __init__(self, host, pw, network):
        Agent.__init__(self, host, pw)
        self.event_manager = EventManager(network)

    def setup(self):
        print(f"EventAgent started at {datetime.datetime.now().time()}")
        start_at = datetime.datetime.now() + datetime.timedelta(seconds=3)
        b = self.EventBehav(period=2, start_at=start_at)
        self.add_behaviour(b)
