import asyncio
from random import choice
from spade.agent import Agent
from spade.behaviour import FSMBehaviour, State

from backend.util import build_message, get_timestamp, load_graph

SUPERVISOR_AGENT = "supervisor@localhost"
GRAPH_PATH = "../data/graphs/test_graph.json"

STATE_SPAWN = "STATE_SPAWN"
STATE_GET_ROUTE = "STATE_GET_ROUTE"
STATE_RECEIVE_ROUTE = "STATE_RECEIVE_ROUTE"
STATE_EDGE_START = "STATE_EDGE_START"
STATE_DRIVE = "STATE_DRIVE"
STATE_EDGE_END = "EDGE_END"
STATE_ARRIVED = "STATE_ARRIVED"
STATE_FINAL = "STATE_FINAL"


class Traveller:

    def __init__(self, num_routes, start_node=None, destination_node=None, max_speed=100, ):
        self.num_routes = num_routes
        self.route_count = 0
        self.graph = load_graph(GRAPH_PATH)
        self.init_state = True
        self.max_speed = max_speed
        self.current_speed = max_speed
        self.travelled_edge_distance = 0
        self.current_edge_distance = 0

        if start_node is not None and destination_node is not None:
            self.current_node = start_node
            self.destination_node = destination_node
        else:
            self.current_node = self.choose_start_node()
            self.destination_node = self.choose_destination_node()

    def inc_route_count(self):
        self.route_count += 1

    def get_nodes(self):
        return self.graph.nodes

    def get_edges(self):
        return self.graph.edges

    def choose_start_node(self):
        return choice(list(self.graph.nodes))

    def choose_destination_node(self):
        destination_node = self.current_node
        while destination_node == self.current_node:
            destination_node = choice(list(self.graph.nodes))
        return destination_node

    def get_next_node(self):
        return self.next_node

    def set_next_node(self, node):
        self.next_node = node

    def set_current_speed(self, speed):
        self.current_speed = speed

    def get_current_speed(self):
        return self.current_speed

    def get_current_edge_distance(self):
        distance = self.graph.get_edge_data(self.current_node, self.get_next_node())["distance"]
        return distance

    def get_travel_time(self):
        return self.get_current_edge_distance() / self.get_current_speed()

    def drive(self):
        self.travelled_edge_distance += self.current_speed


class TravellerBehaviour(FSMBehaviour):
    async def on_start(self):
        await asyncio.sleep(0)

    async def on_end(self):
        print(f"Stopping Agent {self.agent.name}")
        msg = build_message("inform", "despawn", self.agent.name, get_timestamp(), SUPERVISOR_AGENT)
        await self.send(msg)
        self.agent.stop()


class StateSpawn(State):
    async def run(self):
        msg = build_message("inform", "spawn", self.agent.name,
                            f"{get_timestamp()}|{self.agent.traveller.current_node}", SUPERVISOR_AGENT)
        await self.send(msg)
        await asyncio.sleep(0)
        self.set_next_state(STATE_GET_ROUTE)


class StateGetRoute(State):
    async def run(self):
        msg = build_message("request", "get_route", self.agent.name,
                            f"{self.agent.traveller.current_node}"
                            f"|{self.agent.traveller.destination_node}|{self.agent.traveller.init_state}",
                            SUPERVISOR_AGENT)
        await self.send(msg)
        self.agent.traveller.init_state = False
        await asyncio.sleep(0)
        self.set_next_state(STATE_RECEIVE_ROUTE)


class StateReceiveRoute(State):
    async def run(self):
        msg = await self.receive(timeout=10)
        msg_body = msg.body.split("|")
        next_node = int(msg_body[0])
        speed = msg_body[1].split(".")[0]
        speed = int(speed)
        self.agent.traveller.set_next_node(next_node)
        self.agent.traveller.set_current_speed(speed)
        await asyncio.sleep(0)
        self.set_next_state(STATE_EDGE_START)


class StateEdgeStart(State):
    async def run(self):
        msg = build_message("inform", "edge_start", self.agent.name,
                            f"{get_timestamp()}|{self.agent.traveller.current_node}|"
                            f"{self.agent.traveller.next_node}", SUPERVISOR_AGENT)
        await self.send(msg)
        await asyncio.sleep(0)
        self.set_next_state(STATE_DRIVE)


class StateDrive(State):
    async def run(self):
        await asyncio.sleep(self.agent.traveller.get_travel_time())
        await asyncio.sleep(0)
        # while self.agent.traveller.travelled_edge_distance < self.agent.traveller.current_edge_distance:
        #    self.agent.traveller.drive()
        #    await asyncio.sleep(self.agent.traveller.curent_speed / 1000)
        self.set_next_state(STATE_EDGE_END)


class StateEdgeEnd(State):
    async def run(self):
        msg = build_message("inform", "edge_end", self.agent.name,
                            f"{self.agent.traveller.current_node}|"
                            f"{self.agent.traveller.next_node}", SUPERVISOR_AGENT)
        await self.send(msg)
        self.agent.traveller.current_node = self.agent.traveller.next_node
        await asyncio.sleep(0)
        if self.agent.traveller.current_node == self.agent.traveller.destination_node:
            self.set_next_state(STATE_ARRIVED)
        else:
            self.set_next_state(STATE_GET_ROUTE)


class StateArrived(State):
    async def run(self):
        msg = build_message("inform", "arrived", self.agent.name, f"{get_timestamp()}|"
                                                                  f"{self.agent.traveller.current_node}",
                            SUPERVISOR_AGENT)
        print("arrived")
        await self.send(msg)

        self.agent.traveller.inc_route_count()
        await asyncio.sleep(0)
        if self.agent.traveller.route_count == self.agent.traveller.num_routes:
            self.set_next_state(STATE_FINAL)
        else:
            self.agent.traveller.destination_node = self.agent.traveller.choose_destination_node()
            self.set_next_state(STATE_SPAWN)


class StateFinal(State):
    async def run(self):
        await asyncio.sleep(0)
        print("Despawn")


class TravellerAgent(Agent):
    def __init__(self, host, pw, num_routes, start_node=None, destination_node=None, loop=None):
        Agent.__init__(self, host, pw, loop=loop)
        self.traveller = Traveller(num_routes, start_node, destination_node)

    def setup(self):
        print("TravellerAgent started")
        fsm = TravellerBehaviour()

        fsm.add_state(name=STATE_SPAWN, state=StateSpawn(), initial=True)
        fsm.add_state(name=STATE_GET_ROUTE, state=StateGetRoute())
        fsm.add_state(name=STATE_RECEIVE_ROUTE, state=StateReceiveRoute())
        fsm.add_state(name=STATE_EDGE_START, state=StateEdgeStart())
        fsm.add_state(name=STATE_DRIVE, state=StateDrive())
        fsm.add_state(name=STATE_EDGE_END, state=StateEdgeEnd())
        fsm.add_state(name=STATE_ARRIVED, state=StateArrived())
        fsm.add_state(name=STATE_FINAL, state=StateFinal())

        fsm.add_transition(STATE_SPAWN, STATE_GET_ROUTE)
        fsm.add_transition(STATE_GET_ROUTE, STATE_RECEIVE_ROUTE)
        fsm.add_transition(STATE_RECEIVE_ROUTE, STATE_EDGE_START)
        fsm.add_transition(STATE_EDGE_START, STATE_DRIVE)
        fsm.add_transition(STATE_DRIVE, STATE_EDGE_END)
        fsm.add_transition(STATE_EDGE_END, STATE_GET_ROUTE)
        fsm.add_transition(STATE_EDGE_END, STATE_ARRIVED)
        fsm.add_transition(STATE_ARRIVED, STATE_SPAWN)
        fsm.add_transition(STATE_ARRIVED, STATE_FINAL)

        self.add_behaviour(fsm)

        self.presence.subscribe(SUPERVISOR_AGENT)
