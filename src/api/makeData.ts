const range = (len) => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const newPerson = (id) => {
  const statusChance = Math.random();

  //      {
  //         Header: "Ranking",
  //         accessor: "position",
  //       },
  //       {
  //         Header: "Name",
  //         accessor: "name",
  //       },
  //       {
  //         Header: "Change",
  //         accessor: "change",
  //       },
  //       {
  //         Header: "Notes",
  //         accessor: "notes",
  //       },
  return {
    id,
    name: "Name",
    ranking: Math.floor(Math.random() * 8),
    change: Math.floor(Math.random() * 5),
    notes: "test note" + id,
  };
};

export default function makeData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth];
    return range(len).map((i) => {
      return {
        ...newPerson(i),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      };
    });
  };

  return makeDataLevel();
}
