# MAS-Project: Traffic Simulation based on Real-Time Information

This repository holds implementations for

- Python MAS backend traffic simulation &
- HTML/CSS/JS + NodeJS frontend traffic visualization

as well as connected fundamental- and output data, together with Latex sources for the respective written report regarding "Traffic Simulation based on Real-Time Information".

Please be aware, that the simulation is built and tested on Ubuntu 18.04.

Project work conducted by _Konstantin Kloster_ & _Oliver Berg_ regarding project assignment of the lecture *Multi-Agent Systems* in summer term 2018 at University of Kaiserslautern (TU Kaiserslautern), Germany.

## Project Structure

Please find this project's sub-modules in their respective folders:

- NodeJS-based frontend simulator visualization application in `frontend/`
    - contains **instructions how to start web-based UI**
- Python MAS simulator in `backend/`
    - contains **instructions how to start simulator**
- utilized data / logging files (generated from backend, util. in frontend) in `data/`
- Latex project report in `report/`

## Task description:

_(as of officially provided project material)_

"
Supporting travelers with *real-time information*  (RTI) has become a proven technology in providing
passengers with optimal routes. Classically, RTI has been used by transit providers for operations and
control purposes. More recently, RTI is increasingly available to travelers on public (e.g., signage at
stops) and private transport systems (e.g., traffic information based on crowdsourced data).
In this work, we are interested in simulating the dynamic movements and interaction of distributed
entities. To this end, we might implement an agent-based system that consist of several travelers that
have a given origin and destination in a network that might be specified by a graph. For reaching their
destination, the travelers might make use of private vehicles (and / or public transport that follows
certain timetables). The different modes of transport might be modeled by different types of transport
agents. Furthermore, planning agents might be responsible for providing the travelers with a set of
alternative travel options. In this work, random events that change the state of the network might occur
(e.g., breakdowns) and the travel times might depend on the density of the traffic flow (e.g., congestion
slowing down traffic). As a result, travel agents might be in a dynamic relationship with planning agents,
such that, when the expected travel times change, a reaction is possible by updating the route. In this
case, it might be necessary to divert the travelers such that the congestion is overcome without relocating
the congestion to different paths of the network.
"

## Main tasks:

_(as of officially provided project material; some example tasks)_

- Build a simulation platform, where agents consider the shortest path between their origin and destination based on the current state of the network (a visualization is highly recommended).
    - At each vertex, following the dynamics of the network, agents might check if a better path is available.
    - Here, we might differentiate between fully and partially observable environments.
- Identify meaningful measures for evaluating the state of the traffic in the system (e.g., difference between expected and actual travel time).
- We might analyze different types of planning agents and different graphs.
- Finally, we might examine the resilience of the system to stochastic events that lead to a reduction in capacity of an edge / arc (e.g., accidents or breakdowns).

## References

_(as of officially provided project material)_

[1] Brakewood, C., Watkins, K.: A literature review of the passenger benefits of real-time transit information, Transport Reviews, 30 pages, (2018).

[2] Ksontini, F., Zargayouna, M., Scemama, G., Leroy, B.: Building a Realistic Data Environment for Multiagent Mobility Simulation. In Agent and Multi-Agent Systems: Technology and Applications (pp. 57-67). Springer, Cham, (2016).

[3] Mastio, M., Zargayouna, M. and Rana, O.: Towards a distributed multiagent travel simulation. In Agent and Multi-Agent Systems: Technologies and Applications (pp. 15-25). Springer, Cham, (2015).

[4] Zargayouna, M., Zeddini, B., Amine, G., Othman, A.: Agent-Based Simulator for Travelers Multi-modal Mobility, KES-AMSTA, 81–90, (2013).
