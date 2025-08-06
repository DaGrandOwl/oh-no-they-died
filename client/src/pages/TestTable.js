import React, { useEffect, useState } from 'react';

function TestTable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/test`)
      .then(res => res.json())
      .then(json => {
        console.log("Fetched JSON:", json);
        if (Array.isArray(json)) setData(json);
        else console.error("Expected array but got:", json);
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  return (
    <div>
      <h2>Test Table Data</h2>
      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Column 1</th>
              <th>Column 2</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{row.column1}</td>
                <td>{row.column2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TestTable;
