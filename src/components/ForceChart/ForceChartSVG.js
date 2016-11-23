import React, { PureComponent, PropTypes } from 'react';
import _ from 'lodash';
import { Modal } from 'antd';

import { find, randomColor } from 'utils/utils';

export default class ForceChartSVG extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      clubNodesMap: [],
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.clubNodes, this.props.clubNodes)) {
      this.setState({
        clubNodesMap: nextProps.clubNodes.map(() => {
          return false;
        })
      })
    }
  }

  renderLink() {
    const { data, lastTime, width, height } = this.props;
    const { nodes, links } = data;

    return links.map((link, i) => {
      const { source, target, value, relations } = link;

      const { node: sourceNode } = find(nodes, { id: source }, 'id');
      const { node: targetNode } = find(nodes, { id: target }, 'id');

      const x1Values = sourceNode.path.map((e, i) => {
        return sourceNode.ox + e.dx + (width / 2);
      }).join(';');

      const y1Values = sourceNode.path.map((e, i) => {
        return sourceNode.oy + e.dy + (height / 2);
      }).join(';');

      const x2Values = targetNode.path.map((e, i) => {
        return targetNode.ox + e.dx + (width / 2);
      }).join(';');

      const y2Values = targetNode.path.map((e, i) => {
        return targetNode.oy + e.dy + (height / 2);
      }).join(';');

      return (
        <line
          x1={sourceNode.ox + (width / 2)}
          y1={sourceNode.oy + (height / 2)}
          x2={targetNode.ox + (width / 2)}
          y2={targetNode.oy + (height / 2)}
          stroke={'red'}
          strokeWidth={1 + value / 4}
          key={`line-${i}`}
          onClick={() => {
            console.log(link);
          }}
        >
          <animate
            attributeName="x1"
            begin="0"
            dur={`${lastTime}s`}
            values={x1Values}
            repeatCount="1"
            fill="freeze"
          />
          <animate
            attributeName="y1"
            begin="0"
            dur={`${lastTime}s`}
            values={y1Values}
            repeatCount="1"
            fill="freeze"
          />
          <animate
            attributeName="x2"
            begin="0"
            dur={`${lastTime}s`}
            values={x2Values}
            repeatCount="1"
            fill="freeze"
          />
          <animate
            attributeName="y2"
            begin="0"
            dur={`${lastTime}s`}
            values={y2Values}
            repeatCount="1"
            fill="freeze"
          />
        </line>
      );
    });
  }

  handleNodeClick(id) {
    this.props.kSelectedNodeFn(Number(id));
  }

  renderNodes(nodes, isClub = false) {
    const { lastTime, width, height, allNodesList, updateClusters } = this.props;

    return nodes.map((node, i) => {
      const { ox, oy, cx, cy, r, id, group, path, queue, clubNodeNumber } = node;

      let color = '#6e5398';
      let textColor = 'black';

      if (isClub) {
        color = '#f0ad4e';
        textColor = 'black';
      }

      if(isNaN(cx)) console.warn({ cx, cy, r, id, group });
      if(isNaN(cy)) console.warn({ cx, cy, r, id, group });

      const cxValues = path.map((e, i) => {
        return ox + e.dx + (width / 2);
      }).join(';');

      const cyValues = path.map((e, i) => {
        return oy + e.dy + (height / 2);
      }).join(';');

      const xValues = path.map((e, i) => {
        return ox + e.dx + (width / 2) + 15;
      }).join(';');

      const yValues = path.map((e, i) => {
        return oy + e.dy + (height / 2) + 4;
      }).join(';');

      return (
        <g key={i}>
          <circle
            id={id}
            cx={ox + (width / 2)}
            cy={oy + (height / 2)}
            r={r}
            stroke={color}
            strokeWidth={2}
            fill={color}
            key={`circle${i}`}
            onClick={isClub ? () => {
              // 是否加入聚类
              Modal.info({
                title: '提示',
                content: (
                  <p>当前区域是否需要加入上方区域选择区</p>
                ),
                onOk() {
                  const nodeList = queue.map((item, i) => {
                    const id = Number(item);
                    return _.find(allNodesList, { id });
                  })
                  updateClusters([{
                    nodeList,
                    color: randomColor(),
                  }]);
                },
              });
            } : this.handleNodeClick.bind(this, id)}
            style={{
              cursor: "pointer",
              opacity: !isClub && this.state.clubNodesMap[clubNodeNumber] ? 0.4 : 1,
            }}
            onMouseOver={
              isClub ? () => {
                this.setState({
                  clubNodesMap: this.state.clubNodesMap.map((e, j) => {
                    if (i === j) return true;
                    return false;
                  })
                })
              } : () => {}
            }
            onMouseOut={
              isClub ? () => {
                this.setState({
                  clubNodesMap: this.state.clubNodesMap.map((e, j) => {
                    return false;
                  })
                })
              } : () => {}
            }
          >
            <animate
              attributeName="cx"
              begin="0"
              dur={`${lastTime}s`}
              values={cxValues}
              repeatCount="1"
              fill="freeze"
            />
            <animate
              attributeName="cy"
              begin="0"
              dur={`${lastTime}s`}
              values={cyValues}
              repeatCount="1"
              fill="freeze"
            />
          </circle>
          <text
            id={`t${id}`}
            x={ox + (width / 2) + 15}
            y={oy + (height / 2) + 4}
            fill={textColor}
          >
            {id}
            <animate
              attributeName="x"
              begin="0"
              dur={`${lastTime}s`}
              values={xValues}
              repeatCount="1"
              fill="freeze"
            />
            <animate
              attributeName="y"
              begin="0"
              dur={`${lastTime}s`}
              values={yValues}
              repeatCount="1"
              fill="freeze"
            />
          </text>
        </g>
      );
    });
  }

  renderClubNodes() {
    const { lastTime, clubNodes } = this.props;

    const newClubNodes = clubNodes.map((node, i) => {
      return {
        ox: node.ox,
        oy: node.oy,
        cx: node.cx,
        cy: node.cy,
        r: 14,
        id: `c${i}`,
        path: node.path,
        queue: node.queue,
      };
    });

    return this.renderNodes(newClubNodes, true);
  }

  render() {
    const { svgKey, width, height, data } = this.props;
    return (
      <svg
        key={svgKey}
        className="force-chart-main"
        width={width}
        height={height}
      >
        {this.renderLink()}
        {this.renderNodes(data.nodes)}
        {this.renderClubNodes()}
      </svg>
    );
  }
};
