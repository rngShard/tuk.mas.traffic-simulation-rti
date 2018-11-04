import asyncio
import networkx as nx
from spade.agent import Agent
from spade.behaviour import CyclicBehaviour

from backend.logger import CarLogger
from backend.logger import EventLogger
from backend.logger import PlannerLogger
from backend.util import build_message, get_timestamp, load_graph

GRAPH_PATH = "../data/graphs/test_graph.json"


class Supervisor:

    def __init__(self):
        self.graph = load_graph(GRAPH_PATH)
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
        print(path)
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


class SupervisorAgent(Agent):
    class RecvRequestBehav(CyclicBehaviour):
        async def on_start(self):
            pass

        async def on_end(self):
            graph_name = GRAPH_PATH.split("/")[-1].split(".")[0]
            self.agent.supervisor.car_logger.write_log(f"../data/sim_logs/000-{graph_name}-carAgents.log")
            self.agent.supervisor.planner_logger.write_log(f"../data/sim_logs/000-{graph_name}-plannerAgent.log")
            self.agent.supervisor.event_logger.write_log(f"../data/sim_logs/000-{graph_name}-events.log")

        def on_subscribe(self, jid):
            print(f"Agent {jid} approved")
            self.presence.approve(jid)
            self.presence.subscribe(jid)

        async def run(self):
            self.presence.on_subscribe = self.on_subscribe
            msg = await self.receive()
            if msg:
                print(msg)
                to = str(msg.sender)
                agent_id = to
                to = to + "@localhost"
                endpoint = msg.get_metadata("endpoint")
                if endpoint == "get_route":
                    msg_body = msg.body.split("|")
                    current_node = msg_body[0]
                    destination_node = msg_body[1]
                    init_state = msg_body[2]
                    route = self.agent.supervisor.get_route(int(current_node), int(destination_node))
                    next_node = route[1]
                    self.agent.supervisor.increment_density(int(current_node), int(next_node))
                    self.agent.supervisor.update_travel_time(int(current_node), int(next_node))
                    speed = self.agent.supervisor.get_speed(int(current_node), int(next_node))
                    answer = build_message("inform", "get_network", self.agent.name,
                                           f"{next_node}|"
                                           f"{speed}", to=to)
                    await self.send(answer)
                    travel_times = self.agent.supervisor.get_route_travel_time(route)
                    if init_state == "True":
                        self.agent.supervisor.planner_logger.log_plan("INIT", agent_id, get_timestamp(), route,
                                                                      travel_times)
                    else:
                        old_route = self.agent.supervisor.traveller_state_dict[agent_id][0].copy()
                        old_travel_times = self.agent.supervisor.traveller_state_dict[agent_id][1].copy()
                        old_route.pop(0)
                        old_travel_times.pop(0)
                        if route != old_route:
                            self.agent.supervisor.planner_logger.log_plan("REROUTE", agent_id, get_timestamp(), route,
                                                                          travel_times)
                        elif travel_times != old_travel_times:
                            self.agent.supervisor.planner_logger.log_plan("UPDATE", agent_id, get_timestamp(), route,
                                                                          travel_times)

                    self.agent.supervisor.traveller_state_dict[agent_id] = [route, travel_times, int(current_node),
                                                                            int(next_node), int(speed)]
                elif endpoint == "spawn":
                    print("SPAWN")
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    start_node = msg_body[1]
                    self.agent.supervisor.car_logger.log_spawn(agent_id, ts, start_node)

                elif endpoint == "edge_start":
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    current_node = msg_body[1]
                    next_node = msg_body[2]
                    self.agent.supervisor.car_logger.log_enter(agent_id, ts, current_node, next_node,
                                                               int(self.agent.supervisor.
                                                                   get_travel_time(int(current_node), int(next_node))))
                elif endpoint == "edge_end":
                    msg_body = msg.body.split("|")
                    last_node = msg_body[0]
                    next_node = msg_body[1]
                    self.agent.supervisor.decrement_density(int(last_node), int(next_node))
                    self.agent.supervisor.update_travel_time(int(last_node), int(next_node))
                elif endpoint == "arrived":
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    end_node = msg_body[1]
                    self.agent.supervisor.car_logger.log_arrived(agent_id, ts, end_node)
                elif endpoint == "despawn":
                    self.agent.supervisor.car_logger.log_despawn(agent_id, msg.body)
                elif endpoint == "event_road_works_start":
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    node1 = int(msg_body[1])
                    node2 = int(msg_body[2])
                    factor = float(msg_body[3])
                    self.agent.supervisor.set_factor(node1, node2, factor)
                    self.agent.supervisor.update_travel_time(node1, node2)
                    self.agent.supervisor.event_logger.log_event(ts, node1, node2, factor)
                elif endpoint == "event_road_works_end":
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    node1 = int(msg_body[1])
                    node2 = int(msg_body[2])
                    factor = 1
                    self.agent.supervisor.delete_factor(node1, node2)
                    self.agent.supervisor.update_travel_time(node1, node2)
                    self.agent.supervisor.event_logger.log_event(ts, node1, node2, factor)

                await asyncio.sleep(0)

    def setup(self):
        self.supervisor = Supervisor()
        print("ReceiverAgent started")
        b = self.RecvRequestBehav()
        self.add_behaviour(b)
