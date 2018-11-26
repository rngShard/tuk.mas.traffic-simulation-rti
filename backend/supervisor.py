import networkx as nx

from logger import CarLogger
from logger import EventLogger
from logger import PlannerLogger
from util import load_graph

class Supervisor:

    def __init__(self, network):
        self.graph_path = network
        self.graph = load_graph(network)
        self.free_flow_speed = 100
        self.congestion_speed = 20
        self.init_travel_time()
        self.traveller_state_dict = {}
        self.car_logger = CarLogger()
        self.planner_logger = PlannerLogger()
        self.event_logger = EventLogger()

    def init_travel_time(self):
        for edge in self.graph.edges:
            self.update_travel_time(edge[0], edge[1])

    def update_travel_time(self, node_i, node_j):
        edge_data = self.graph.get_edge_data(node_i, node_j)
        distance = edge_data["distance"]
        capacity = edge_data["capacity"]
        density = edge_data["density"]
        factor = edge_data["factor"]

        if density <= capacity:
            # cost = self.free_flow_speed
            speed = self.free_flow_speed
        else:
            # cost = density / (-self.congestion_speed * (density - capacity) + self.free_flow_speed * capacity)
            speed = (-self.congestion_speed * (density - capacity) + self.free_flow_speed * capacity) / density
        if factor is not None:
            speed = speed * factor
        if speed < 10:
            speed = 10
        self.graph[node_i][node_j]["travel_time"] = distance / speed * 1000
        self.graph[node_i][node_j]["speed"] = speed

    def set_factor(self, node_i, node_j, factor):
        self.graph[node_i][node_j]["factor"] = factor

    def delete_factor(self, node_i, node_j):
        self.graph[node_i][node_j]["factor"] = None

    def increment_density(self, node_i, node_j):
        self.graph[node_i][node_j]["density"] += 1

    def decrement_density(self, node_i, node_j):
        self.graph[node_i][node_j]["density"] -= 1

    def get_route(self, current_node, destination_node):
        path = nx.shortest_path(self.graph, current_node, destination_node, "travel_time")
        return path

    def get_speed(self, node_i, node_j):
        return self.graph[node_i][node_j]["speed"]

    def get_distance(self, node_i, node_j):
        return self.graph[node_i][node_j]["distance"]

    def get_travel_time(self, node_i, node_j):
        return self.graph[node_i][node_j]["travel_time"]

    def get_route_travel_time(self, route):
        travel_times = []
        for key, node in enumerate(route):
            try:
                next_node = route[key + 1]
            except IndexError:
                break
            travel_time = self.get_travel_time(node, next_node)
            travel_times.append(travel_time)
        return travel_times

    def estimate_travel_time(self, agent_id):
        traveller_state = self.traveller_state_dict[agent_id]
        return self.get_distance(traveller_state[2], traveller_state[3]) / traveller_state[4] * 1000
