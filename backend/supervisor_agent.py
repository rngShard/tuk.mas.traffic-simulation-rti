import asyncio

from spade.agent import Agent
from spade.behaviour import CyclicBehaviour
from util import build_message, get_timestamp
from supervisor import Supervisor


class SupervisorAgent(Agent):
    class RecvRequestBehav(CyclicBehaviour):
        async def on_start(self):
            pass

        async def on_end(self):
            graph_name = self.agent.supervisor.graph_path.split("/")[-1].split(".")[0]
            self.agent.supervisor.car_logger.write_log(graph_name, "carAgents")
            self.agent.supervisor.planner_logger.write_log(graph_name, "plannerAgent")
            self.agent.supervisor.event_logger.write_log(graph_name, "events")

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
                elif endpoint == "get_speed":
                    msg_body = msg.body.split("|")
                    current_node = msg_body[0]
                    next_node = msg_body[1]
                    init_state = msg_body[2]
                    travel_times = msg_body[3][1:-1]
                    if len(travel_times) > 0:
                        travel_times = [i for i in travel_times.split(",")]
                    travel_times = [float(i) * 1000 for i in travel_times]
                    route = msg_body[4][1:-1]
                    if len(route) > 1:
                        route = [int(i) for i in route.split(",")]
                    self.agent.supervisor.increment_density(int(current_node), int(next_node))
                    self.agent.supervisor.update_travel_time(int(current_node), int(next_node))
                    speed = self.agent.supervisor.get_speed(int(current_node), int(next_node))
                    answer = build_message("inform", "get_speed", self.agent.name,
                                           f"{speed}", to=to)
                    await self.send(answer)
                    if init_state == "True":
                        self.agent.supervisor.planner_logger.log_plan("INIT", agent_id, get_timestamp(), route,
                                                                      travel_times)
                    else:
                        old_travel_times = self.agent.supervisor.traveller_state_dict[agent_id][1].copy()
                        old_travel_times.pop(0)
                        if travel_times != old_travel_times:
                            self.agent.supervisor.planner_logger.log_plan("UPDATE", agent_id, get_timestamp(), route,
                                                                          travel_times)

                    self.agent.supervisor.traveller_state_dict[agent_id] = [route, travel_times, int(current_node),
                                                                            int(next_node), int(speed)]

                elif endpoint == "spawn":
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    start_node = msg_body[1]
                    agent_type = msg_body[2]
                    self.agent.supervisor.car_logger.log_spawn(agent_id, ts, start_node, agent_type)

                elif endpoint == "edge_start":
                    msg_body = msg.body.split("|")
                    ts = msg_body[0]
                    current_node = msg_body[1]
                    next_node = msg_body[2]
                    agent_type = msg_body[3]
                    print(agent_type)
                    if agent_type == "global":
                        self.agent.supervisor.car_logger.log_enter(agent_id, ts, current_node, next_node,
                                                                   int(self.agent.supervisor.
                                                                       get_travel_time(int(current_node),
                                                                                       int(next_node))))
                    elif agent_type == "local":
                        travel_time = msg_body[4]
                        self.agent.supervisor.car_logger.log_enter(agent_id, ts, current_node, next_node,
                                                                   int(float(travel_time) * 1000))

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

    def __init__(self, host, pw, network):
        Agent.__init__(self, host, pw)
        self.supervisor = Supervisor(network)

    def setup(self):
        print("ReceiverAgent started")
        b = self.RecvRequestBehav()
        self.add_behaviour(b)
