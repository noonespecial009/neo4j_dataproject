import React, {Component} from 'react'

import * as d3 from 'd3';

import './edge_bundled.diagram.style.css';

export class EdgeBundled extends Component {


    render_edge_bundled = (data) => {
        const classes = data;
        let diameter = 960,
            radius = diameter / 2,
            innerRadius = radius - 120;

        let cluster = d3.cluster()
            .size([360, innerRadius]);

        let line = d3.radialLine()
            .curve(d3.curveBundle.beta(0.85))
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; });

        let svg = d3.select(this.ref).append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .append("g")
            .attr("transform", "translate(" + radius + "," + radius + ")");

        let link = svg.append("g").selectAll(".link"),
            node = svg.append("g").selectAll(".node");


            let root = packageHierarchy(classes)
                .sum(function(d) { return d.size; });

            cluster(root);

            link = link
                .data(packageImports(root.leaves()))
                .enter().append("path")
                .each(function(d) {
                    d.source = d[0];
                    d.target = d[d.length - 1];
                    return d;
                })
                .attr("class", "link")
                .attr("d", line);

            node = node
                .data(root.leaves())
                .enter().append("text")
                .attr("class", "node")
                .attr("dy", "0.31em")
                .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
                .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                .text(function(d) { return d.data.key; })
                .on("mouseover", mouseovered)
                .on("mouseout", mouseouted);

        function mouseovered(d) {
            node
                .each(function(n) { n.target = n.source = false; });

            link
                .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
                .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
                .filter(function(l) { return l.target === d || l.source === d; })
                .raise();

            node
                .classed("node--target", function(n) { return n.target; })
                .classed("node--source", function(n) { return n.source; });
        }

        function mouseouted(d) {
            link
                .classed("link--target", false)
                .classed("link--source", false);

            node
                .classed("node--target", false)
                .classed("node--source", false);
        }

        function packageHierarchy(classes) {
            let map = {};

            function find(name, data) {
                let node = map[name], i;
                if (!node) {
                    node = map[name] = data || {name: name, children: []};
                    if (name.length) {
                        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
                        node.parent.children.push(node);
                        node.key = name.substring(i + 1);
                    }
                }
                return node;
            }

            classes.forEach(function(d) {
                find(d.name, d);
            });

            return d3.hierarchy(map[""]);
        }

        function packageImports(nodes) {
            let map = {},
                imports = [];

            // Compute a map from name to node.
            nodes.forEach(function(d) {
                map[d.data.name] = d;
            });

            // For each import, construct a link from the source to target node.
            nodes.forEach(function(d) {
                if (d.data.imports) d.data.imports.forEach(function(i) {
                    imports.push(map[d.data.name].path(map[i]));
                });
            });

            return imports;
        }
    };

    componentDidMount() {
        fetch(`${this.props.ip}/edge-bundling?size=${this.props.size}`)
            .then(result => (result.json()))
            .then(data => {
                this.render_edge_bundled(data);
            })

    }

    render(){
        return (
            <svg ref={(ref) => this.ref = ref} width={1000} height={1000}>
            </svg>
        );
    }
}
