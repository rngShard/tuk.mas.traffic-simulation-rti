from random import choice

from util import load_graph


class EventManager:
    def __init__(self, network):
        self.graph = load_graph(network)
        self.events = ["road_works_start", "road_works_start", "road_works_start", "road_works_start",
                       "road_works_end"]
        # self.events = ["road_works_start", "road_works_start", "road_works_start", "road_works_start",
        #               "road_works_end", "spawn_random_agents", "spawn_random"]
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
