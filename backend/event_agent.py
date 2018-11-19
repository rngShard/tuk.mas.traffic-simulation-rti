import datetime
from random import choice
from spade.agent import Agent
from spade.behaviour import PeriodicBehaviour

from backend.traveller_agent import TravellerAgent
from backend.util import build_message, get_timestamp, load_graph

SUPERVISOR_AGENT = "supervisor@localhost"
GRAPH_PATH = "../data/graphs/test_graph.json"

class EventManager:
    def __init__(self):
        self.graph = load_graph(GRAPH_PATH)
        self.events = ["road_works_start", "road_works_start", "road_works_start", "road_works_start",
                        "road_works_end"]
        self.event_factors = [round(i * 0.1, 2) for i in range(2, 10)]
        self.event_times = [i for i in range(3, 10)]
        self.num_agents = [i for i in range(1, 6)]
        self.agent_counter = 1
        self.construction_sites = set()

    def get_random_event(self):
        return choice(list(self.events))

    def get_random_edge(self):
        return choice(list(self.graph.edges))

    def get_random_factor(self):
        return choice(self.event_factors)

    def get_random_event_time(self):
        return choice(self.event_times)

    def get_random_num_agents(self):
        return choice(self.num_agents)

    def inc_agent_counter(self):
        self.agent_counter += 1
        return self.agent_counter

    def choose_start_node(self):
        return choice(list(self.graph.nodes))

    def choose_destination_node(self, start_node):
        destination_node = start_node
        nodes = list(self.graph.nodes)
        while destination_node == start_node:
            destination_node = choice(nodes)
        return destination_node

    def road_works(self):
        edge = self.get_random_edge()
        factor = self.get_random_factor()
        # time = self.get_random_event_time()
        return edge, factor

    def spawn_agents(self):
        start_node = self.choose_start_node()
        destination_node = self.choose_destination_node(start_node)
        num_agents = self.get_random_num_agents()
        return num_agents, start_node, destination_node


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
                    agents.append(TravellerAgent(f"eventtest{num}@localhost", "test", 1, loop=self.agent.loop))
                for agent in agents:
                    print("EventAgent start!")
                    await agent.async_start()
                if event == "spawn_agents":
                    num_agents, start_node, destination_node = self.agent.event_manager.spawn_agents()
                    agents = []
                    for _ in range(num_agents):
                        num = self.agent.event_manager.inc_agent_counter()
                        agents.append(
                            TravellerAgent(f"eventtest{num}@localhost", "test", 1, start_node, destination_node,
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

    def setup(self):
        self.event_manager = EventManager()
        print(f"EventAgent started at {datetime.datetime.now().time()}")
        start_at = datetime.datetime.now() + datetime.timedelta(seconds=3)
        b = self.EventBehav(period=2, start_at=start_at)
        self.add_behaviour(b)
