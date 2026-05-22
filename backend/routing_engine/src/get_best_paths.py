import heapq
from collections import defaultdict
import networkx as nx
from routing_engine.src.data_structures.connected_route_graph import ConnectedRouteGraph
from routing_engine.src.types.types import PathType

def get_best_paths(conn_graph: ConnectedRouteGraph, budget: float):
    graph = conn_graph.graph
    for u, v, k in graph.edges:
        if 'toll_cost' not in graph[u][v][k]:
            graph[u][v][k]['toll_cost'] = 0.0

    graph_dict = {}
    for node in graph.nodes:
        lst = []
        for neighbor in graph[node]:
            duration = graph.edges[node, neighbor, 0]['duration']
            toll_cost = graph.edges[node, neighbor, 0]['toll_cost']
            assert duration is not None and toll_cost is not None
            lst.append((neighbor, duration, toll_cost))
        graph_dict[node] = lst

    return n_best_constrained_paths(graph_dict, conn_graph.start_node_id, conn_graph.end_node_id, budget)


def n_best_constrained_paths(graph, start, end, budget, n=3) -> list[PathType]:
    """
    graph: dict {node: [(neighbor, time_cost, money_cost), ...]}
    start, end: node ids
    budget: max allowable money cost
    n: number of best paths to return

    return: [([node_ids, ...], time_cost, money_cost), ...]
    """
    pq = [(0, 0, start, [start])]  # (time, cost, node, path)
    paths = []
    visited = defaultdict(list)  # node -> list of (time, cost)
    
    while pq and len(paths) < n:
        time, cost, node, path = heapq.heappop(pq)
        
        # Reached destination within budget
        if node == end and cost <= budget:
            paths.append((path, time, cost))
            continue
        
        # Dominance check — skip if a better (time,cost) already exists
        dominated = False
        for t, c in visited[node]:
            if t <= time and c <= cost:
                dominated = True
                break
        if dominated:
            continue
        
        visited[node].append((time, cost))
        
        # Explore neighbors
        for neighbor, t_cost, m_cost in graph[node]:
            new_time = time + t_cost
            new_cost = cost + m_cost
            if new_cost <= budget:
                heapq.heappush(pq, (new_time, new_cost, neighbor, path + [neighbor]))
    
    return paths
